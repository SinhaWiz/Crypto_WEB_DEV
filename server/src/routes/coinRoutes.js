import express from 'express';
import { getPrices, getHistory, refreshPrices } from '../controllers/coinController.js';

const router = express.Router();

router.get('/', getPrices);
router.post('/refresh', refreshPrices);
router.get('/:symbol/history', getHistory);

export default router;
