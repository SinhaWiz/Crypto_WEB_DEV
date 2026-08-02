import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listCoins, getCoin, getCoinHistory } from '../controllers/coinController.js';

const router = Router();

router.get('/', asyncHandler(listCoins));
router.get('/:symbol/history', asyncHandler(getCoinHistory));
router.get('/:symbol', asyncHandler(getCoin));

export default router;
