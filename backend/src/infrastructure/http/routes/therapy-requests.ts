import { Router, Response, NextFunction } from 'express';
import { CreateTherapyRequestUseCase } from '../../../application/therapy-requests/CreateTherapyRequestUseCase';
import { RespondTherapyRequestUseCase } from '../../../application/therapy-requests/RespondTherapyRequestUseCase';
import { ListTherapyRequestsUseCase } from '../../../application/therapy-requests/ListTherapyRequestsUseCase';
import { sendSuccess } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const createTherapyRequestUseCase = new CreateTherapyRequestUseCase();
const respondTherapyRequestUseCase = new RespondTherapyRequestUseCase();
const listTherapyRequestsUseCase = new ListTherapyRequestsUseCase();

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
    const result = await listTherapyRequestsUseCase.execute(req.user!.id, req.user!.role);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
export { router as therapyRequestsRouter };
