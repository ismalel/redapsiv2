import { Router, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';
import { sendSuccess } from '../../../shared/response';
import { ApiError } from '../../../shared/apiError';

const router = Router();

router.post('/', requireAuth, (req: any, res: Response, next: NextFunction) => {
  uploadMiddleware.single('file')(req, res, (err: any) => {
    if (err) {
      if (err instanceof Error && err.message === 'File too large') {
        return next(ApiError.badRequest('File exceeds limit', 'FILE_TOO_LARGE'));
      }
      return next(err);
    }

    if (!req.file) {
      return next(ApiError.badRequest('No file uploaded', 'FILE_MISSING'));
    }

    const folder = (req.query.folder as string) || 'misc';
    const fileUrl = `/uploads/${folder}/${req.file.filename}`;

    return sendSuccess(res, { url: fileUrl }, 201);
  });
});

export default router;
export { router as uploadRouter };
