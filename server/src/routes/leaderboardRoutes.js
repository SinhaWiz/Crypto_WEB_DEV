import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { getLeaderboardEntries } from '../controllers/leaderboardController.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(getLeaderboardEntries));

export default router;
