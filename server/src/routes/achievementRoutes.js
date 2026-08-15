import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { getAchievements } from '../controllers/achievementController.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(getAchievements));

export default router;
