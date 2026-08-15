import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { getPortfolio } from '../controllers/portfolioController.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(getPortfolio));

export default router;
