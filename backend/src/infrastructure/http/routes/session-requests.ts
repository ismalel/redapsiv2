import { Router, Response, NextFunction } from 'express';
import { CreateSessionRequestUseCase } from '../../../application/session-requests/CreateSessionRequestUseCase';
import { RespondSessionRequestUseCase } from '../../../application/session-requests/RespondSessionRequestUseCase';
import { ListSessionRequestsUseCase } from '../../../application/session-requests/ListSessionRequestsUseCase';
import { sendSuccess } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role, SessionType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prismaClient';
import { hasRole } from '../../../shared/hasRole';
import { ApiError } from '../../../shared/apiError';

// This router handles nested routes: /therapies/:id/session-requests
const nestedRouter = Router({ mergeParams: true });

const createSessionRequestUseCase = new CreateSessionRequestUseCase();
const respondSessionRequestUseCase = new RespondSessionRequestUseCase();
const listSessionRequestsUseCase = new ListSessionRequestsUseCase();

const createSessionRequestSchema = z.object({
  proposed_at: z.coerce.date(),
  notes: z.string().optional(),
  type: z.nativeEnum(SessionType).optional(),
});

const respondSessionRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

// GET /therapies/:id/session-requests
nestedRouter.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Severity 2 Fix: Authorization check (B12)
    const therapy = await prisma.therapy.findUnique({ where: { id: req.params.id } });
    if (!therapy) throw ApiError.notFound('Terapia no encontrada');
    
    const isParticipant = therapy.psychologist_id === req.user!.id || therapy.consultant_id === req.user!.id;
    const isAdmin = hasRole(req.user!, Role.ADMIN);
    
    if (!isParticipant && !isAdmin) {
      throw ApiError.forbidden('No tienes permiso para ver estas solicitudes');
    }

    const result = await listSessionRequestsUseCase.execute(req.params.id);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /therapies/:id/session-requests (Consultant only)
nestedRouter.post('/', requireAuth, requireRole(Role.CONSULTANT), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { proposed_at, notes, type } = createSessionRequestSchema.parse(req.body);
    const result = await createSessionRequestUseCase.execute(req.user!.id, {
      therapy_id: req.params.id,
      proposed_at,
      notes,
      type
    });
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

// This router handles top-level routes: /session-requests
const topLevelRouter = Router();

// PATCH /session-requests/:id (Psychologist only) - Fixed to match spec (B3)
topLevelRouter.patch('/:id', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = respondSessionRequestSchema.parse(req.body);
    const result = await respondSessionRequestUseCase.execute(req.user!.id, req.params.id, status);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export { nestedRouter as sessionRequestsNestedRouter, topLevelRouter as sessionRequestsRouter };
