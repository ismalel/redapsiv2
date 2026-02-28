import { Router, Response, NextFunction } from 'express';
import { NotificationService } from '../../../application/notifications/NotificationService';
import { sendSuccess, sendPaginated } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const notificationService = new NotificationService();

router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 20;
    const { notifications, total } = await notificationService.getUserNotifications(req.user!.id, page, perPage);
    return sendPaginated(res, notifications, total, page, perPage);
  } catch (err) {
    next(err);
  }
});

router.get('/unread-count', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id);
    return sendSuccess(res, { count });
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    return sendSuccess(res, { message: 'Todas las notificaciones marcadas como leídas' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user!.id);
    return sendSuccess(res, { message: 'Notificación marcada como leída' });
  } catch (err) {
    next(err);
  }
});

export default router;
export { router as notificationsRouter };
