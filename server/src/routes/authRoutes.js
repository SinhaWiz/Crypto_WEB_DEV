import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { authRateLimit } from '../middlewares/rateLimits.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { register, login, logout, me } from '../controllers/authController.js';
import { loginSchema, registerSchema } from '../validation/schemas.js';

const router = Router();

router.post('/register', authRateLimit, validateRequest(registerSchema), asyncHandler(register));
router.post('/login', authRateLimit, validateRequest(loginSchema), asyncHandler(login));
router.post('/logout', logout);
router.get('/me', requireAuth, asyncHandler(me));

export default router;
