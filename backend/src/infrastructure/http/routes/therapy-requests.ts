import { Router, Response, NextFunction } from 'express';
import { CreateTherapyRequestUseCase } from '../../../application/therapy-requests/CreateTherapyRequestUseCase';
import { RespondTherapyRequestUseCase } from '../../../application/therapy-requests/RespondTherapyRequestUseCase';
import { sendSuccess } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role, TherapyRequestStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prismaClient';

const router = Router();

const createTherapyRequestUseCase = new CreateTherapyRequestUseCase();
const respondTherapyRequestUseCase = new RespondTherapyRequestUseCase();

const createRequestSchema = z.object({
  psychologist_id: z.string().uuid(),
  message: z.string().optional(),
});

const respondRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

router.post('/', requireAuth, requireRole(Role.CONSULTANT), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = createRequestSchema.parse(req.body);
    const result = await createTherapyRequestUseCase.execute(req.user!.id, input);
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = respondRequestSchema.parse(req.body);
    const result = await respondTherapyRequestUseCase.execute(req.user!.id, req.params.id, status);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let where: any = {};
    if (req.user!.role === Role.PSYCHOLOGIST || req.user!.role === Role.ADMIN_PSYCHOLOGIST) {
      where = { psychologist_id: req.user!.id };
    } else if (req.user!.role === Role.CONSULTANT) {
      where = { consultant_id: req.user!.id };
    }

    const requests = await prisma.therapyRequest.findMany({
      where,
      include: {
        psychologist: { select: { name: true, avatar_url: true } },
        consultant: { select: { name: true, avatar_url: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return sendSuccess(res, requests);
  } catch (err) {
    next(err);
  }
});

export default router;
export { router as therapyRequestsRouter };
