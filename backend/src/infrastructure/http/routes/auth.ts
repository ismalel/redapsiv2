import { Router, Request, Response, NextFunction } from 'express';
import { AuthRepository } from '../../repositories/AuthRepository';
import { RegisterUseCase } from '../../../application/auth/RegisterUseCase';
import { LoginUseCase } from '../../../application/auth/LoginUseCase';
import { RefreshTokenUseCase } from '../../../application/auth/RefreshTokenUseCase';
import { LogoutUseCase } from '../../../application/auth/LogoutUseCase';
import { ChangePasswordUseCase } from '../../../application/auth/ChangePasswordUseCase';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema } from '../../../shared/auth.schema';
import { sendSuccess } from '../../../shared/response';
import { requireAuth } from '../middleware/auth';

const router = Router();
const authRepository = new AuthRepository();

const registerUseCase = new RegisterUseCase(authRepository);
const loginUseCase = new LoginUseCase(authRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(authRepository);
const logoutUseCase = new LogoutUseCase(authRepository);
const changePasswordUseCase = new ChangePasswordUseCase(authRepository);

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUseCase.execute(input);
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUseCase.execute(input);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = refreshTokenSchema.parse(req.body);
    const result = await refreshTokenUseCase.execute(input);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refresh_token } = refreshTokenSchema.parse(req.body);
    await logoutUseCase.execute(refresh_token);
    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

router.put('/change-password', requireAuth, async (req: any, res: Response, next: NextFunction) => {
  try {
    const input = changePasswordSchema.parse(req.body);
    await changePasswordUseCase.execute(req.user.id, input);
    return sendSuccess(res, { message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
export { router as authRouter };
