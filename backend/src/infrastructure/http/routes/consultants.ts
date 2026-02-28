import { Router, Response, NextFunction } from 'express';
import { ConsultantRepository } from '../../repositories/ConsultantRepository';
import { GetConsultantProfileUseCase } from '../../../application/consultants/GetConsultantProfileUseCase';
import { UpdateConsultantProfileUseCase } from '../../../application/consultants/UpdateConsultantProfileUseCase';
import { GetOnboardingUseCase } from '../../../application/consultants/GetOnboardingUseCase';
import { SubmitOnboardingStepUseCase } from '../../../application/consultants/SubmitOnboardingStepUseCase';
import { updateConsultantProfileSchema, onboardingStepSchema } from '../../../shared/profile.schema';
import { sendSuccess } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const consultantRepository = new ConsultantRepository();

const getConsultantProfileUseCase = new GetConsultantProfileUseCase(consultantRepository);
const updateConsultantProfileUseCase = new UpdateConsultantProfileUseCase(consultantRepository);
const getOnboardingUseCase = new GetOnboardingUseCase(consultantRepository);
const submitOnboardingStepUseCase = new SubmitOnboardingStepUseCase(consultantRepository);

router.get('/me/profile', requireAuth, requireRole(Role.CONSULTANT), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await getConsultantProfileUseCase.execute(req.user!.id);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.put('/me/profile', requireAuth, requireRole(Role.CONSULTANT), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = updateConsultantProfileSchema.parse(req.body);
    const result = await updateConsultantProfileUseCase.execute(req.user!.id, input as any);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/onboarding', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Middleware for authorization: ADMIN, PSYCHOLOGIST, or OWN consultant
    const targetUserId = req.params.id;
    const isOwn = req.user!.id === targetUserId;
    const isStaff = req.user!.role === Role.ADMIN || req.user!.role === Role.PSYCHOLOGIST || req.user!.role === Role.ADMIN_PSYCHOLOGIST;

    if (!isOwn && !isStaff) {
       return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You cannot access this onboarding data' } });
    }

    const result = await getOnboardingUseCase.execute(targetUserId);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.put('/:id/onboarding/:step', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const targetUserId = req.params.id;
    if (req.user!.id !== targetUserId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only update your own onboarding' } });
    }

    const step = parseInt(req.params.step);
    const { data } = onboardingStepSchema.parse({ data: req.body });
    await submitOnboardingStepUseCase.execute(targetUserId, step, data);
    
    // Return updated state
    const updatedState = await getOnboardingUseCase.execute(targetUserId);
    return sendSuccess(res, updatedState);
  } catch (err) {
    next(err);
  }
});

export default router;
export { router as consultantsRouter };
