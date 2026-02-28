import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { ApiError } from '../../../shared/apiError';
import { prisma } from '../database/prismaClient';

export const requirePasswordChange = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
  }

  // Check if the current route is the change-password endpoint
  // If it is, we allow it even if must_change_password is true
  if (req.path === '/change-password' || req.path === '/logout') {
    return next();
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { must_change_password: true }
  });

  if (user?.must_change_password) {
    return next(ApiError.forbidden('Password change required', 'PASSWORD_CHANGE_REQUIRED'));
  }

  next();
};
