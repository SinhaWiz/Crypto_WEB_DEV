import express from 'express';
import { getPrices, getHistory, refreshPrices, getCoin } from '../controllers/coinController.js';

const router = express.Router();

router.get('/', getPrices);
router.post('/refresh', refreshPrices);
router.get('/:symbol', getCoin);
router.get('/:symbol/history', getHistory);

export default router;
