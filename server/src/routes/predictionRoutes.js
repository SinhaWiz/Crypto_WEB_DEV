import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { placePrediction } from '../controllers/predictionController.js';

const router = Router();

router.post('/', requireAuth, asyncHandler(placePrediction));

export default router;
