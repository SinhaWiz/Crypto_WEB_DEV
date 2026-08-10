import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buyCoin, sellCoin, showPortfolio, showTransactions } from '../controllers/tradeController.js';

const router = Router();

router.use(requireAuth);
router.post('/trades/buy', asyncHandler(buyCoin));
router.post('/trades/sell', asyncHandler(sellCoin));
router.get('/portfolio', asyncHandler(showPortfolio));
router.get('/transactions', asyncHandler(showTransactions));

export default router;
