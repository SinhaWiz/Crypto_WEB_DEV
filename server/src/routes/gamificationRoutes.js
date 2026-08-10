import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { showAchievements, showLeaderboard } from '../controllers/gamificationController.js';

const router = Router();

router.use(requireAuth);
router.get('/achievements', asyncHandler(showAchievements));
router.get('/leaderboard', asyncHandler(showLeaderboard));

export default router;
