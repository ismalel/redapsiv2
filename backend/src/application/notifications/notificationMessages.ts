import { NotificationType } from '@prisma/client';

export interface NotificationMessage {
  title: string;
  body: string;
}

export const NOTIFICATION_MESSAGES: Record<NotificationType, (payload?: any) => NotificationMessage> = {
  [NotificationType.THERAPY_REQUEST_RECEIVED]: () => ({
    title: 'Nueva solicitud de terapia',
    body: 'Has recibido una nueva solicitud de una consultante.',
  }),
  [NotificationType.THERAPY_REQUEST_ACCEPTED]: (payload) => ({
    title: 'Solicitud aceptada',
    body: `La psicóloga ${payload?.psychologist_name || ''} ha aceptado tu solicitud.`,
  }),
  [NotificationType.THERAPY_REQUEST_REJECTED]: (payload) => ({
    title: 'Solicitud no aceptada',
    body: `La psicóloga ${payload?.psychologist_name || ''} no puede atender tu solicitud en este momento.`,
  }),
  [NotificationType.PROPOSITION_RECEIVED]: () => ({
    title: 'Nuevos horarios propuestos',
    body: 'Tu psicóloga ha propuesto horarios para tu próxima sesión.',
  }),
  [NotificationType.PROPOSITION_ACCEPTED]: () => ({
    title: 'Horario confirmado',
    body: 'La consultante ha seleccionado uno de los horarios propuestos.',
  }),
  [NotificationType.SESSION_REQUEST_RECEIVED]: () => ({
    title: 'Solicitud de sesión',
    body: 'Has recibido una solicitud de horario para una sesión.',
  }),
  [NotificationType.SESSION_REQUEST_ACCEPTED]: () => ({
    title: 'Sesión confirmada',
    body: 'Tu solicitud de sesión ha sido aceptada.',
  }),
  [NotificationType.SESSION_REQUEST_REJECTED]: () => ({
    title: 'Sesión rechazada',
    body: 'Tu solicitud de sesión no ha sido aceptada.',
  }),
  [NotificationType.SESSION_SCHEDULED]: () => ({
    title: 'Sesión programada',
    body: 'Se ha programado una nueva sesión en tu agenda.',
  }),
  [NotificationType.SESSION_CANCELLED]: () => ({
    title: 'Sesión cancelada',
    body: 'Una sesión programada ha sido cancelada.',
  }),
  [NotificationType.SESSION_POSTPONED]: () => ({
    title: 'Sesión pospuesta',
    body: 'Se ha solicitado posponer una sesión.',
  }),
  [NotificationType.SESSION_COMPLETED]: () => ({
    title: 'Sesión completada',
    body: 'La sesión ha finalizado exitosamente.',
  }),
  [NotificationType.NOTE_ADDED]: () => ({
    title: 'Nueva nota de sesión',
    body: 'Se ha añadido una nota pública a una de tus sesiones.',
  }),
  [NotificationType.PAYMENT_REGISTERED]: (payload) => ({
    title: 'Pago registrado',
    body: `Se ha registrado un pago por un monto de $${payload?.amount || ''}.`,
  }),
  [NotificationType.PAYMENT_PENDING]: () => ({
    title: 'Pago pendiente',
    body: 'Tienes un pago pendiente por realizar.',
  }),
  [NotificationType.GOAL_UPDATED]: (payload) => ({
    title: 'Objetivo actualizado',
    body: `Se ha actualizado el progreso de: ${payload?.goal_title || ''}.`,
  }),
  [NotificationType.NEW_MESSAGE]: () => ({
    title: 'Nuevo mensaje',
    body: 'Has recibido un nuevo mensaje en el chat.',
  }),
  [NotificationType.EVENT_REGISTRATION_CONFIRMED]: () => ({
    title: 'Registro a evento confirmado',
    body: 'Tu registro al evento ha sido confirmado.',
  }),
  [NotificationType.EVENT_REGISTRATION_CANCELLED]: () => ({
    title: 'Registro a evento cancelado',
    body: 'Tu registro al evento ha sido cancelado.',
  }),
};
