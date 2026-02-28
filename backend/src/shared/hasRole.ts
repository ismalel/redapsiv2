import { Role } from '@prisma/client';

export type UserWithRole = {
  role: Role;
};

export const hasRole = (user: UserWithRole, requiredRole: Role): boolean => {
  if (user.role === Role.ADMIN_PSYCHOLOGIST) {
    return requiredRole === Role.ADMIN || requiredRole === Role.PSYCHOLOGIST || requiredRole === Role.ADMIN_PSYCHOLOGIST;
  }
  
  return user.role === requiredRole;
};
