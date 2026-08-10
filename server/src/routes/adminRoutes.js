import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listAdminUsers, updateSimulation, updateUserStatus } from '../controllers/adminController.js';
import { updateSimulationSchema, updateUserStatusSchema } from '../validation/schemas.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/users', asyncHandler(listAdminUsers));
router.patch('/users/:id/status', validateRequest(updateUserStatusSchema), asyncHandler(updateUserStatus));
router.patch('/simulation', validateRequest(updateSimulationSchema), asyncHandler(updateSimulation));

export default router;
