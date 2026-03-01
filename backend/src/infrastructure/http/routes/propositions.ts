import { Router, Response, NextFunction } from 'express';
import { CreatePropositionUseCase } from '../../../application/propositions/CreatePropositionUseCase';
import { SelectPropositionSlotUseCase } from '../../../application/propositions/SelectPropositionSlotUseCase';
import { ListPropositionsUseCase } from '../../../application/propositions/ListPropositionsUseCase';
import { sendSuccess } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role, SessionType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prismaClient';
import { hasRole } from '../../../shared/hasRole';
import { ApiError } from '../../../shared/apiError';

// This router handles nested routes: /therapies/:id/propositions
const nestedRouter = Router({ mergeParams: true });

const createPropositionUseCase = new CreatePropositionUseCase();
const listPropositionsUseCase = new ListPropositionsUseCase();
const selectPropositionSlotUseCase = new SelectPropositionSlotUseCase();

const createPropositionSchema = z.object({
  proposed_slots: z.array(z.coerce.date()).min(1),
  type: z.nativeEnum(SessionType).optional(),
});

const selectSlotSchema = z.object({
  selected_slot: z.coerce.date(),
});

// GET /therapies/:id/propositions
nestedRouter.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Severity 2 Fix: Authorization check (B12)
    const therapy = await prisma.therapy.findUnique({ where: { id: req.params.id } });
    if (!therapy) throw ApiError.notFound('Terapia no encontrada');
    
    const isParticipant = therapy.psychologist_id === req.user!.id || therapy.consultant_id === req.user!.id;
    const isAdmin = hasRole(req.user!, Role.ADMIN);
    
    if (!isParticipant && !isAdmin) {
      throw ApiError.forbidden('No tienes permiso para ver estas propuestas');
    }

    const result = await listPropositionsUseCase.execute(req.params.id);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /therapies/:id/propositions (Psychologist only)
nestedRouter.post('/', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { proposed_slots, type } = createPropositionSchema.parse(req.body);
    const result = await createPropositionUseCase.execute(req.user!.id, {
      therapy_id: req.params.id,
      proposed_slots,
      type
    });
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

// This router handles top-level routes: /propositions
const topLevelRouter = Router();

// PATCH /propositions/:id (Consultant only) - Fixed to match spec (B3)
topLevelRouter.patch('/:id', requireAuth, requireRole(Role.CONSULTANT), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { selected_slot } = selectSlotSchema.parse(req.body);
    const result = await selectPropositionSlotUseCase.execute(req.user!.id, req.params.id, selected_slot);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export { nestedRouter as propositionsNestedRouter, topLevelRouter as propositionsRouter };
