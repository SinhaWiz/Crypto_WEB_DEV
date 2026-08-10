import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listAdminUsers, updateSimulation, updateUserStatus } from '../controllers/adminController.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/users', asyncHandler(listAdminUsers));
router.patch('/users/:id/status', asyncHandler(updateUserStatus));
router.patch('/simulation', asyncHandler(updateSimulation));

export default router;
