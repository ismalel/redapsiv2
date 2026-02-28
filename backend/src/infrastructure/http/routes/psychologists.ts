import { Router, Response, NextFunction, Request } from 'express';
import { PsychologistRepository } from '../../repositories/PsychologistRepository';
import { ListPsychologistsUseCase } from '../../../application/psychologists/ListPsychologistsUseCase';
import { GetPsychologistProfileUseCase } from '../../../application/psychologists/GetPsychologistProfileUseCase';
import { GetOwnPsychologistProfileUseCase } from '../../../application/psychologists/GetOwnPsychologistProfileUseCase';
import { UpdatePsychologistProfileUseCase } from '../../../application/psychologists/UpdatePsychologistProfileUseCase';
import { SetAvailabilityUseCase } from '../../../application/psychologists/SetAvailabilityUseCase';
import { updatePsychologistProfileSchema, setAvailabilitySchema } from '../../../shared/profile.schema';
import { sendSuccess } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role } from '@prisma/client';

const router = Router();
const psychologistRepository = new PsychologistRepository();

const listPsychologistsUseCase = new ListPsychologistsUseCase(psychologistRepository);
const getPsychologistProfileUseCase = new GetPsychologistProfileUseCase(psychologistRepository);
const getOwnPsychologistProfileUseCase = new GetOwnPsychologistProfileUseCase(psychologistRepository);
const updatePsychologistProfileUseCase = new UpdatePsychologistProfileUseCase(psychologistRepository);
const setAvailabilityUseCase = new SetAvailabilityUseCase(psychologistRepository);

// Public list
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const availableOnly = req.query.available === 'true';
    const result = await listPsychologistsUseCase.execute(availableOnly);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// Private routes (Psychologist only) - REGISTERED BEFORE /:id
router.get('/me/profile', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await getOwnPsychologistProfileUseCase.execute(req.user!.id);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.put('/me/profile', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = updatePsychologistProfileSchema.parse(req.body);
    const result = await updatePsychologistProfileUseCase.execute(req.user!.id, input as any);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.put('/me/availability', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = setAvailabilitySchema.parse(req.body);
    await setAvailabilityUseCase.execute(req.user!.id, input);
    return sendSuccess(res, { message: 'Availability updated successfully' });
  } catch (err) {
    next(err);
  }
});

// Parameterized public routes
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getPsychologistProfileUseCase.execute(req.params.id);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await getPsychologistProfileUseCase.execute(req.params.id);
    return sendSuccess(res, profile.availability_slots);
  } catch (err) {
    next(err);
  }
});

export default router;
export { router as psychologistsRouter };
