import { Router, Response, NextFunction } from 'express';
import { ListNotesUseCase } from '../../../application/session-notes/ListNotesUseCase';
import { CreateNoteUseCase } from '../../../application/session-notes/CreateNoteUseCase';
import { UpdateNoteUseCase } from '../../../application/session-notes/UpdateNoteUseCase';
import { DeleteNoteUseCase } from '../../../application/session-notes/DeleteNoteUseCase';
import { sendSuccess } from '../../../shared/response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

// mergeParams: true allows accessing :id from the parent router (sessions)
const router = Router({ mergeParams: true });

const listNotesUseCase = new ListNotesUseCase();
const createNoteUseCase = new CreateNoteUseCase();
const updateNoteUseCase = new UpdateNoteUseCase();
const deleteNoteUseCase = new DeleteNoteUseCase();

const noteSchema = z.object({
  content: z.string().min(1),
  is_private: z.boolean(),
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id; // From parent router
    const result = await listNotesUseCase.execute(sessionId, req.user!.id, req.user!.role);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id;
    const input = noteSchema.parse(req.body);
    const result = await createNoteUseCase.execute(sessionId, req.user!.id, req.user!.role, input);
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/:noteId', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = noteSchema.partial().parse(req.body);
    const result = await updateNoteUseCase.execute(req.params.noteId, req.user!.id, input);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.delete('/:noteId', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await deleteNoteUseCase.execute(req.params.noteId, req.user!.id);
    return sendSuccess(res, null, 204);
  } catch (err) {
    next(err);
  }
});

export default router;
export { router as notesNestedRouter };
