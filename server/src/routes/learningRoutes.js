import { Router } from 'express';
import { getLearningContent } from '../controllers/learningController.js';

const router = Router();

// Public educational content — no auth required.
router.get('/', getLearningContent);

export default router;
