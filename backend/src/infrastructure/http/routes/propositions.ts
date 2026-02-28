import { Router, Response, NextFunction } from 'express';
import { CreatePropositionUseCase } from '../../../application/propositions/CreatePropositionUseCase';
import { SelectPropositionSlotUseCase } from '../../../application/propositions/SelectPropositionSlotUseCase';
import { sendSuccess } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prismaClient';

const router = Router({ mergeParams: true }); // Enable mergeParams to access therapyId from parent

const createPropositionUseCase = new CreatePropositionUseCase();
const selectPropositionSlotUseCase = new SelectPropositionSlotUseCase();

const createPropositionSchema = z.object({
  proposed_slots: z.array(z.coerce.date()).min(1),
});

const selectSlotSchema = z.object({
  selected_slot: z.coerce.date(),
});

// GET /therapies/:id/propositions
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const propositions = await prisma.scheduleProposition.findMany({
      where: { therapy_id: req.params.id }, // 'id' from therapiesRouter
      orderBy: { created_at: 'desc' },
    });
    return sendSuccess(res, propositions);
  } catch (err) {
    next(err);
  }
});

// POST /therapies/:id/propositions (Psychologist only)
router.post('/', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { proposed_slots } = createPropositionSchema.parse(req.body);
    const result = await createPropositionUseCase.execute(req.user!.id, {
      therapy_id: req.params.id,
      proposed_slots
    });
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /propositions/:id - Mounting logic will handle this
// Actually, I'll keep the select logic separate or handle it via mount
router.patch('/:propositionId/select', requireAuth, requireRole(Role.CONSULTANT), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { selected_slot } = selectSlotSchema.parse(req.body);
    const result = await selectPropositionSlotUseCase.execute(req.user!.id, req.params.propositionId, selected_slot);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
export { router as propositionsRouter };
