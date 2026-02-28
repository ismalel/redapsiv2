import { Therapy, TherapyStatus, TherapyOrigin, BillingType } from '@prisma/client';

export interface CreateTherapyInput {
  consultant_email: string;
  consultant_name: string;
  modality: string;
  notes?: string;
  billing_plan: {
    billing_type: BillingType;
    default_fee: number;
    recurrence?: string;
  };
}

export interface UpdateTherapyInput {
  modality?: string;
  notes?: string;
  status?: TherapyStatus;
}

export interface ICreateTherapyUseCase {
  execute(psychologistId: string, input: CreateTherapyInput): Promise<Therapy>;
}

export interface IGetTherapyUseCase {
  execute(therapyId: string, userId: string, role: string): Promise<Therapy>;
}

export interface IListTherapiesUseCase {
  execute(userId: string, role: string, page: number, perPage: number): Promise<{ data: Therapy[]; total: number }>;
}
