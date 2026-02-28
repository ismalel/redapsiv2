import { Router, Response, NextFunction } from 'express';
import { CreatePropositionUseCase } from '../../../application/propositions/CreatePropositionUseCase';
import { SelectPropositionSlotUseCase } from '../../../application/propositions/SelectPropositionSlotUseCase';
import { sendSuccess } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prismaClient';

const router = Router();

const createPropositionUseCase = new CreatePropositionUseCase();
const selectPropositionSlotUseCase = new SelectPropositionSlotUseCase();

const createPropositionSchema = z.object({
  proposed_slots: z.array(z.coerce.date()).min(1),
});

const selectSlotSchema = z.object({
  selected_slot: z.coerce.date(),
});

// GET propositions for a therapy
router.get('/therapy/:therapyId', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const propositions = await prisma.scheduleProposition.findMany({
      where: { therapy_id: req.params.therapyId },
      orderBy: { created_at: 'desc' },
    });
    return sendSuccess(res, propositions);
  } catch (err) {
    next(err);
  }
});

// POST new proposition (Psychologist only)
router.post('/therapy/:therapyId', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { proposed_slots } = createPropositionSchema.parse(req.body);
    const result = await createPropositionUseCase.execute(req.user!.id, {
      therapy_id: req.params.therapyId,
      proposed_slots
    });
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

// PATCH select slot (Consultant only)
router.patch('/:id/select', requireAuth, requireRole(Role.CONSULTANT), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { selected_slot } = selectSlotSchema.parse(req.body);
    const result = await selectPropositionSlotUseCase.execute(req.user!.id, req.params.id, selected_slot);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
export { router as propositionsRouter };
