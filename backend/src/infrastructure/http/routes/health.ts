import { Router } from 'express';
import { sendSuccess } from '../../../shared/response';

const router = Router();

router.get('/', (req, res) => {
  return sendSuccess(res, { status: 'ok' });
});

export default router;
export { router as healthRouter };
