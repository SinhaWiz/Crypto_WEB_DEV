import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { getWallet, buyPoints } from '../controllers/walletController.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(getWallet));
router.post('/buy-points', requireAuth, asyncHandler(buyPoints));

export default router;
