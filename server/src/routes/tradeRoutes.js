import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { tradeRateLimit } from '../middlewares/rateLimits.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buyCoin, sellCoin, showPortfolio, showTransactions } from '../controllers/tradeController.js';
import { tradeSchema } from '../validation/schemas.js';

const router = Router();

router.use(requireAuth);
router.post('/trades/buy', tradeRateLimit, validateRequest(tradeSchema), asyncHandler(buyCoin));
router.post('/trades/sell', tradeRateLimit, validateRequest(tradeSchema), asyncHandler(sellCoin));
router.get('/portfolio', asyncHandler(showPortfolio));
router.get('/transactions', asyncHandler(showTransactions));

export default router;
