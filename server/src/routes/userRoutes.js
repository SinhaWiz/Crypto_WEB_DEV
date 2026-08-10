import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { updateMe } from '../controllers/userController.js';
import { updateMeSchema } from '../validation/schemas.js';

const router = Router();

router.patch('/me', requireAuth, validateRequest(updateMeSchema), asyncHandler(updateMe));

export default router;
