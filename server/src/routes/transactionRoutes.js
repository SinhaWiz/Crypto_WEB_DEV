import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { getTransactions } from '../controllers/transactionController.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(getTransactions));

export default router;
