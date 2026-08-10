import { env } from '../config/env.js';
import { settleDuePredictions } from '../services/predictionService.js';

let intervalId = null;

export function startPredictionSettlementJob() {
  if (intervalId) return intervalId;

  intervalId = setInterval(() => {
    settleDuePredictions().catch((err) => {
      console.error('Prediction settlement job failed:', err);
    });
  }, env.PRICE_TICK_INTERVAL_MS);

  intervalId.unref?.();
  return intervalId;
}
