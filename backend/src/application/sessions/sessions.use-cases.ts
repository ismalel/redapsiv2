import { TherapySession, SessionStatus } from '@prisma/client';

export interface ListSessionsInput {
  therapy_id?: string;
  status?: SessionStatus;
  page?: number;
  per_page?: number;
}

export interface IListSessionsUseCase {
  execute(userId: string, role: string, input: ListSessionsInput): Promise<{ data: TherapySession[]; total: number }>;
}

export interface IGetSessionUseCase {
  execute(sessionId: string, userId: string, role: string): Promise<TherapySession & { effective_fee: number }>;
}

export interface ICompleteSessionUseCase {
  execute(sessionId: string, psychologistId: string): Promise<TherapySession>;
}

export interface ICancelSessionUseCase {
  execute(sessionId: string, userId: string, role: string, reason?: string): Promise<TherapySession>;
}

export interface IPostponeSessionUseCase {
  execute(sessionId: string, userId: string, role: string, newDate: Date, reason?: string): Promise<TherapySession>;
}

export interface IConfirmPostponeUseCase {
  execute(sessionId: string, psychologistId: string): Promise<TherapySession>;
}

export interface IUpdateSessionFeeUseCase {
  execute(sessionId: string, psychologistId: string, fee: number): Promise<TherapySession>;
}

export interface IAttachSessionMediaUseCase {
  execute(sessionId: string, psychologistId: string, mediaUrl: string): Promise<TherapySession>;
}
