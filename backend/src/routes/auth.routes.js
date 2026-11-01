import { Router } from 'express';
import { changeMyPassword, getCsrfToken, login, logout, me, register, updateMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter, passwordLimiter, registerLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from '../validators/auth.validators.js';

const router = Router();

router.get('/csrf', getCsrfToken);
router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.patch('/me', authenticate, validate(updateProfileSchema), updateMe);
router.patch('/password', authenticate, passwordLimiter, validate(changePasswordSchema), changeMyPassword);

export default router;
