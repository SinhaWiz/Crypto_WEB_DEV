import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createPredictionChallenge, showPredictionHistory } from '../controllers/predictionController.js';

const router = Router();

router.use(requireAuth);
router.post('/', asyncHandler(createPredictionChallenge));
router.get('/history', asyncHandler(showPredictionHistory));

export default router;
