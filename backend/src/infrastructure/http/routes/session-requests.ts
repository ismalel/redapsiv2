import { Router, Response, NextFunction } from 'express';
import { CreateSessionRequestUseCase } from '../../../application/session-requests/CreateSessionRequestUseCase';
import { RespondSessionRequestUseCase } from '../../../application/session-requests/RespondSessionRequestUseCase';
import { sendSuccess } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prismaClient';

const router = Router({ mergeParams: true });

const createSessionRequestUseCase = new CreateSessionRequestUseCase();
const respondSessionRequestUseCase = new RespondSessionRequestUseCase();

const createSessionRequestSchema = z.object({
  proposed_at: z.coerce.date(),
  notes: z.string().optional(),
});

const respondSessionRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

// GET /therapies/:id/session-requests
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.sessionRequest.findMany({
      where: { therapy_id: req.params.id },
      orderBy: { created_at: 'desc' },
    });
    return sendSuccess(res, requests);
  } catch (err) {
    next(err);
  }
});

// POST /therapies/:id/session-requests (Consultant only)
router.post('/', requireAuth, requireRole(Role.CONSULTANT), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { proposed_at, notes } = createSessionRequestSchema.parse(req.body);
    const result = await createSessionRequestUseCase.execute(req.user!.id, {
      therapy_id: req.params.id,
      proposed_at,
      notes
    });
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /session-requests/:id - Independent mount
router.patch('/:requestId', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = respondSessionRequestSchema.parse(req.body);
    const result = await respondSessionRequestUseCase.execute(req.user!.id, req.params.requestId, status);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
export { router as sessionRequestsRouter };
