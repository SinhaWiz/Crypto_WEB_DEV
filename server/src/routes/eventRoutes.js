import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { listEvents, triggerEventHandler, getEventLog } from '../controllers/eventController.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(listEvents));
router.get('/log', requireAuth, asyncHandler(getEventLog));
router.post('/:code/trigger', requireAuth, asyncHandler(triggerEventHandler));

export default router;
