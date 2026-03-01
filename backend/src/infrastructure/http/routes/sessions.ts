import { Router, Response, NextFunction } from 'express';
import { ListSessionsUseCase } from '../../../application/sessions/ListSessionsUseCase';
import { GetSessionUseCase } from '../../../application/sessions/GetSessionUseCase';
import { CompleteSessionUseCase } from '../../../application/sessions/CompleteSessionUseCase';
import { CancelSessionUseCase } from '../../../application/sessions/CancelSessionUseCase';
import { PostponeSessionUseCase } from '../../../application/sessions/PostponeSessionUseCase';
import { ConfirmPostponeUseCase } from '../../../application/sessions/ConfirmPostponeUseCase';
import { UpdateSessionFeeUseCase } from '../../../application/sessions/UpdateSessionFeeUseCase';
import { AttachSessionMediaUseCase } from '../../../application/sessions/AttachSessionMediaUseCase';
import { sendSuccess, sendPaginated } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role, SessionStatus } from '@prisma/client';
import { z } from 'zod';
import { notesNestedRouter } from './session-notes';

const router = Router();

const listSessionsUseCase = new ListSessionsUseCase();
const getSessionUseCase = new GetSessionUseCase();
const completeSessionUseCase = new CompleteSessionUseCase();
const cancelSessionUseCase = new CancelSessionUseCase();
const postponeSessionUseCase = new PostponeSessionUseCase();
const confirmPostponeUseCase = new ConfirmPostponeUseCase();
const updateSessionFeeUseCase = new UpdateSessionFeeUseCase();
const attachSessionMediaUseCase = new AttachSessionMediaUseCase();

const cancelSchema = z.object({
  reason: z.string().optional(),
});

const postponeSchema = z.object({
  new_date: z.string().datetime(),
  reason: z.string().optional(),
});

const updateFeeSchema = z.object({
  session_fee: z.number().min(0),
});

const mediaSchema = z.object({
  media_url: z.string().min(1),
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 20;
    const therapy_id = req.query.therapy_id as string;
    const status = req.query.status as SessionStatus;

    const { data, total } = await listSessionsUseCase.execute(req.user!.id, req.user!.role, {
      therapy_id,
      status,
      page,
      per_page: perPage,
    });
    return sendPaginated(res, data, total, page, perPage);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await getSessionUseCase.execute(req.params.id, req.user!.id, req.user!.role);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = updateFeeSchema.parse(req.body);
    const result = await updateSessionFeeUseCase.execute(req.params.id, req.user!.id, input.session_fee);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/complete', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await completeSessionUseCase.execute(req.params.id, req.user!.id);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/cancel', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = cancelSchema.parse(req.body);
    const result = await cancelSessionUseCase.execute(req.params.id, req.user!.id, req.user!.role, input.reason);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/postpone', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = postponeSchema.parse(req.body);
    const result = await postponeSessionUseCase.execute(req.params.id, req.user!.id, req.user!.role, new Date(input.new_date), input.reason);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/confirm-postpone', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await confirmPostponeUseCase.execute(req.params.id, req.user!.id);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/media', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = mediaSchema.parse(req.body);
    const result = await attachSessionMediaUseCase.execute(req.params.id, req.user!.id, input.media_url);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// Nest notes under /sessions/:id/notes
router.use('/:id/notes', notesNestedRouter);

export default router;
export { router as sessionsRouter };
