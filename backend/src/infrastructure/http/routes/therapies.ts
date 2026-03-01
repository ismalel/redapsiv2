import { Router, Response, NextFunction } from 'express';
import { CreateTherapyUseCase } from '../../../application/therapies/CreateTherapyUseCase';
import { GetTherapyUseCase } from '../../../application/therapies/GetTherapyUseCase';
import { UpdateTherapyUseCase } from '../../../application/therapies/UpdateTherapyUseCase';
import { ListTherapiesUseCase } from '../../../application/therapies/ListTherapiesUseCase';
import { CreateRecurrenceUseCase } from '../../../application/therapies/CreateRecurrenceUseCase';
import { sendSuccess, sendPaginated } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role, BillingType, TherapyStatus } from '@prisma/client';
import { z } from 'zod';
import { propositionsNestedRouter } from './propositions';
import { sessionRequestsNestedRouter } from './session-requests';
import { therapyNotesRouter } from './therapy-notes';

const router = Router();

const createTherapyUseCase = new CreateTherapyUseCase();
const getTherapyUseCase = new GetTherapyUseCase();
const updateTherapyUseCase = new UpdateTherapyUseCase();
const listTherapiesUseCase = new ListTherapiesUseCase();
const createRecurrenceUseCase = new CreateRecurrenceUseCase();

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

const recurrenceSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  duration: z.number().min(15),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY']),
  sessions_count: z.number().optional(),
  start_date: z.string().datetime(),
});

const updateTherapySchema = z.object({
  modality: z.string().optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(TherapyStatus).optional(),
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

router.patch('/:id', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = updateTherapySchema.parse(req.body);
    const result = await updateTherapyUseCase.execute(req.params.id, req.user!.id, input);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/recurrence', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = recurrenceSchema.parse(req.body);
    const result = await createRecurrenceUseCase.execute(req.user!.id, {
      ...input,
      therapy_id: req.params.id
    });
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

// Nest sub-resources under /therapies/:id
router.use('/:id/propositions', propositionsNestedRouter);
router.use('/:id/session-requests', sessionRequestsNestedRouter);
router.use('/:id/notes', therapyNotesRouter);

export default router;
export { router as therapiesRouter };
