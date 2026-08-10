import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createPredictionChallenge, showPredictionHistory } from '../controllers/predictionController.js';
import { predictionSchema } from '../validation/schemas.js';

const router = Router();

router.use(requireAuth);
router.post('/', validateRequest(predictionSchema), asyncHandler(createPredictionChallenge));
router.get('/history', asyncHandler(showPredictionHistory));

export default router;
