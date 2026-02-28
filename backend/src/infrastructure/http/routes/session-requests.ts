import { Router, Response, NextFunction } from 'express';
import { CreateSessionRequestUseCase } from '../../../application/session-requests/CreateSessionRequestUseCase';
import { RespondSessionRequestUseCase } from '../../../application/session-requests/RespondSessionRequestUseCase';
import { sendSuccess } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prismaClient';

const router = Router();

const createSessionRequestUseCase = new CreateSessionRequestUseCase();
const respondSessionRequestUseCase = new RespondSessionRequestUseCase();

const createSessionRequestSchema = z.object({
  therapy_id: z.string().uuid(),
  proposed_at: z.coerce.date(),
  notes: z.string().optional(),
});

const respondSessionRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

// GET requests for a therapy
router.get('/therapy/:therapyId', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.sessionRequest.findMany({
      where: { therapy_id: req.params.therapyId },
      orderBy: { created_at: 'desc' },
    });
    return sendSuccess(res, requests);
  } catch (err) {
    next(err);
  }
});

// POST new request (Consultant only)
router.post('/', requireAuth, requireRole(Role.CONSULTANT), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = createSessionRequestSchema.parse(req.body);
    const result = await createSessionRequestUseCase.execute(req.user!.id, input);
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

// PATCH respond to request (Psychologist only)
router.patch('/:id', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = respondSessionRequestSchema.parse(req.body);
    const result = await respondSessionRequestUseCase.execute(req.user!.id, req.params.id, status);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
export { router as sessionRequestsRouter };
