import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from './auth';
import { hasRole } from '../../../shared/hasRole';
import { ApiError } from '../../../shared/apiError';

export const requireRole = (allowedRoles: Role | Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const isAuthorized = roles.some(role => hasRole(req.user!, role));

    if (!isAuthorized) {
      return next(ApiError.forbidden('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS'));
    }

    next();
  };
};
