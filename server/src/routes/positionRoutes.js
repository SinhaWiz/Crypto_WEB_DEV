import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { closePosition, listPositions, openPosition } from '../controllers/positionController.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(listPositions));
router.post('/open', requireAuth, asyncHandler(openPosition));
router.post('/close', requireAuth, asyncHandler(closePosition));

export default router;
