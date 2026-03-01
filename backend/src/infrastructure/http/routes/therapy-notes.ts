import { Router, Response, NextFunction } from 'express';
import { ListTherapyNotesUseCase } from '../../../application/therapy-notes/ListTherapyNotesUseCase';
import { CreateTherapyNoteUseCase } from '../../../application/therapy-notes/CreateTherapyNoteUseCase';
import { UpdateTherapyNoteUseCase } from '../../../application/therapy-notes/UpdateTherapyNoteUseCase';
import { DeleteTherapyNoteUseCase } from '../../../application/therapy-notes/DeleteTherapyNoteUseCase';
import { sendSuccess } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role } from '@prisma/client';
import { z } from 'zod';

const router = Router({ mergeParams: true });

const listUseCase = new ListTherapyNotesUseCase();
const createUseCase = new CreateTherapyNoteUseCase();
const updateUseCase = new UpdateTherapyNoteUseCase();
const deleteUseCase = new DeleteTherapyNoteUseCase();

const noteSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  content: z.string().min(1, 'El contenido es requerido'),
});

router.get('/', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await listUseCase.execute(req.params.id, req.user!.id);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = noteSchema.parse(req.body);
    const result = await createUseCase.execute(req.params.id, req.user!.id, input);
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/:noteId', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = noteSchema.partial().parse(req.body);
    const result = await updateUseCase.execute(req.params.noteId, req.user!.id, input);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.delete('/:noteId', requireAuth, requireRole(Role.PSYCHOLOGIST), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await deleteUseCase.execute(req.params.noteId, req.user!.id);
    return sendSuccess(res, null, 204);
  } catch (err) {
    next(err);
  }
});

export default router;
export { router as therapyNotesRouter };
