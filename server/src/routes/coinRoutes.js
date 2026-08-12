import express from 'express';
import { listCoins, getCoin, getHistory, refreshPrices } from '../controllers/coinController.js';

const router = express.Router();

router.get('/', listCoins);
router.post('/refresh', refreshPrices);
router.get('/:symbol/history', getHistory);
router.get('/:symbol', getCoin);

export default router;
