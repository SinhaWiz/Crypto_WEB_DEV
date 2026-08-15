import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { placePrediction, getPredictionHistory } from '../controllers/predictionController.js';

const router = Router();

router.post('/', requireAuth, asyncHandler(placePrediction));
router.get('/history', requireAuth, asyncHandler(getPredictionHistory));

export default router;
