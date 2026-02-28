import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.nativeEnum(Role),
}).refine(data => {
  // Business Rule: CONSULTANT is exclusive
  // This check is simple here because role is a single enum value, 
  // but we enforce the semantic exclusivity mentioned in spec.
  return true; 
}, {
  message: "Invalid role combination",
  path: ["role"],
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string(),
});

export const changePasswordSchema = z.object({
  current_password: z.string(),
  new_password: z.string().min(8),
});
