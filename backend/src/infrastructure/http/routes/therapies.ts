import { Router, Response, NextFunction, Request } from 'express';
import { CreateTherapyUseCase } from '../../../application/therapies/CreateTherapyUseCase';
import { GetTherapyUseCase } from '../../../application/therapies/GetTherapyUseCase';
import { ListTherapiesUseCase } from '../../../application/therapies/ListTherapiesUseCase';
import { sendSuccess, sendPaginated } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role, BillingType } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const createTherapyUseCase = new CreateTherapyUseCase();
const getTherapyUseCase = new GetTherapyUseCase();
const listTherapiesUseCase = new ListTherapiesUseCase();

const createTherapySchema = z.object({
  consultant_email: z.string().email(),
  consultant_name: z.string().min(2),
  modality: z.string(),
  notes: z.string().optional(),
  billing_plan: z.object({
    billing_type: z.nativeEnum(BillingType),
    default_fee: z.number().min(0),
    recurrence: z.string().optional(),
  }),
});

router.post('/', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = createTherapySchema.parse(req.body);
    const result = await createTherapyUseCase.execute(req.user!.id, input);
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 20;
    const { data, total } = await listTherapiesUseCase.execute(req.user!.id, req.user!.role, page, perPage);
    return sendPaginated(res, data, total, page, perPage);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await getTherapyUseCase.execute(req.params.id, req.user!.id, req.user!.role);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
export { router as therapiesRouter };
