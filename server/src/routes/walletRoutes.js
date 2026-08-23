import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { getWallet, buyPoints, claimStipend } from '../controllers/walletController.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(getWallet));
router.post('/buy-points', requireAuth, asyncHandler(buyPoints));
router.post('/stipend', requireAuth, asyncHandler(claimStipend));

export default router;
