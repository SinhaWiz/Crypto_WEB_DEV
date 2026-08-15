import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { buy, sell } from '../controllers/tradeController.js';

const router = Router();

router.post('/buy', requireAuth, asyncHandler(buy));
router.post('/sell', requireAuth, asyncHandler(sell));

export default router;
