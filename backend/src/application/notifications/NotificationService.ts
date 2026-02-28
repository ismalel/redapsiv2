import { NotificationType } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';
import { NOTIFICATION_MESSAGES } from './notificationMessages';

export class NotificationService {
  /**
   * Creates a notification for a user.
   * This should be called within the same transaction if possible,
   * but for v1 we keep it simple.
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    payload?: any,
    tx?: any
  ) {
    const messageTemplate = NOTIFICATION_MESSAGES[type];
    if (!messageTemplate) {
      console.error(`No message template found for notification type: ${type}`);
      return;
    }

    const { title, body } = messageTemplate(payload);
    const db = tx || prisma;

    // Severity 2 Fix: Debounce NEW_MESSAGE notifications (60 seconds)
    if (type === NotificationType.NEW_MESSAGE && payload?.therapy_id) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const existingNotification = await db.notification.findFirst({
        where: {
          user_id: userId,
          type: NotificationType.NEW_MESSAGE,
          created_at: { gte: oneMinuteAgo },
          payload: {
            path: ['therapy_id'],
            equals: payload.therapy_id,
          },
        },
      });

      if (existingNotification) return;
    }

    return await db.notification.create({
      data: {
        user_id: userId,
        type,
        title,
        body,
        payload: payload || {},
      },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.update({
      where: { id: notificationId, user_id: userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true },
    });
  }

  async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: { user_id: userId, read: false },
    });
  }

  async getUserNotifications(userId: string, page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.notification.count({ where: { user_id: userId } }),
    ]);

    return { notifications, total };
  }
}
