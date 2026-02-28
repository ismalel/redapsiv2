import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../../../shared/apiError';

const UPLOADS_BASE_DIR = process.env.UPLOADS_DIR || 'uploads';
const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || '10')) * 1024 * 1024;

const allowedFolders = ['avatars', 'sessions', 'chat', 'events'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = (req.query.folder as string) || 'misc';
    
    if (!allowedFolders.includes(folder)) {
      return cb(ApiError.badRequest('Invalid upload folder'), '');
    }

    const dest = path.join(process.cwd(), UPLOADS_BASE_DIR, folder);
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|webp|pdf|mp4/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  
  cb(ApiError.unprocessableEntity('Invalid file type. Allowed: jpg, png, webp, pdf, mp4'), false);
};

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});
