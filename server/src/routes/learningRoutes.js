import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listLearningContent } from '../controllers/learningController.js';

const router = Router();

router.get('/', asyncHandler(listLearningContent));

export default router;
