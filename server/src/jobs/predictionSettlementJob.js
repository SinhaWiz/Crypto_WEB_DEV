import cron from 'node-cron';
import { PredictionChallenge } from '../models/PredictionChallenge.js';
import { Wallet } from '../models/Wallet.js';
import { SimulationSession } from '../models/SimulationSession.js';
import { getLatestSimulatedPrice, getAnchorPriceBDT } from '../services/simulation/engine.js';

// Winners get their staked points back plus an equal bonus; losers forfeit
// the stake they already paid when the prediction was created.
const WIN_PAYOUT_MULTIPLIER = 2;

/**
 * Resolve the live simulated price for a user+symbol, caching each user's
 * active session for the duration of a single settlement batch.
 */
async function resolveLivePriceBDT(sessionCache, userId, symbol) {
  const cacheKey = userId.toString();
  let session = sessionCache.get(cacheKey);
  if (session === undefined) {
    session = await SimulationSession.findOne({ userId, status: 'active' });
    sessionCache.set(cacheKey, session);
  }
  if (!session) {
    return getAnchorPriceBDT(symbol);
  }
  const latestTick = await getLatestSimulatedPrice(session._id, symbol);
  return latestTick?.priceBDT ?? (await getAnchorPriceBDT(symbol));
}

/**
 * Settle every prediction whose closesAt has passed: resolve the end
 * price against the owning user's own simulated price path, record
 * win/loss, and credit winnings to the wallet.
 */
export async function settleDuePredictions() {
  const now = new Date();
  const duePredictions = await PredictionChallenge.find({ result: 'pending', closesAt: { $lte: now } });
  if (duePredictions.length === 0) return;

  const sessionCache = new Map();

  for (const prediction of duePredictions) {
    const endPriceBDT = await resolveLivePriceBDT(sessionCache, prediction.userId, prediction.symbol);
    const isWin =
      (prediction.direction === 'up' && endPriceBDT > prediction.startPriceBDT) ||
      (prediction.direction === 'down' && endPriceBDT < prediction.startPriceBDT);

    prediction.endPriceBDT = endPriceBDT;
    prediction.result = isWin ? 'win' : 'loss';
    await prediction.save();

    if (isWin) {
      await Wallet.updateOne(
        { userId: prediction.userId },
        { $inc: { virtualPoints: prediction.pointsStaked * WIN_PAYOUT_MULTIPLIER } }
      );
    }
  }

  console.log(`[JOB] predictionSettlementJob settled ${duePredictions.length} prediction(s)`);
}

export function startPredictionSettlementJob() {
  cron.schedule('* * * * *', () => {
    settleDuePredictions().catch((err) => {
      console.error('[JOB] predictionSettlementJob error:', err.message);
    });
  });

  console.log('[JOB] predictionSettlementJob scheduled (every minute)');
}
