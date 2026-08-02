import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { getWallet } from '../controllers/walletController.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(getWallet));

export default router;
