import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { register, login, logout, me } from '../controllers/authController.js';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/logout', logout);
router.get('/me', requireAuth, asyncHandler(me));

export default router;
