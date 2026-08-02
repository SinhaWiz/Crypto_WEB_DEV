import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { updateMe } from '../controllers/userController.js';

const router = Router();

router.patch('/me', requireAuth, asyncHandler(updateMe));

export default router;
