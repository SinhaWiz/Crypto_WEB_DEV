import crypto from 'crypto';
import { SUPPORTED_SYMBOLS, BDT_PER_USD } from '../../constants/index.js';
import { PriceHistory } from '../../models/PriceHistory.js';
import { SimulatedPriceTick } from '../../models/SimulatedPriceTick.js';
import { seededNormal } from './seededRandom.js';

// Fallback USD prices if DB has no history yet
const FALLBACK_USD_ANCHORS = {
  BTC: 65000,
  ETH: 3500,
  SOL: 150,
  DOGE: 0.14,
  XRP: 0.6,
  BNB: 600,
};

const DIFFICULTY_PRESETS = {
  beginner: { volatility: 0.0025, drift: 0.00005 },
  intermediate: { volatility: 0.006, drift: 0.0001 },
  expert: { volatility: 0.012, drift: 0.00015 },
};

function normalizeDifficulty(difficulty) {
  return DIFFICULTY_PRESETS[difficulty] ? difficulty : 'beginner';
}

/**
 * Create a unique random seed for a new simulation session.
 */
export function createSimulationSeed(userId) {
  return crypto
    .createHash('sha256')
    .update(`${userId}:${crypto.randomUUID()}`)
    .digest('hex')
    .slice(0, 24);
}

/**
 * Get the anchor price in BDT for a symbol.
 * Uses the latest close price from DB (USD) * BDT_PER_USD, or a fallback.
 */
export async function getAnchorPriceBDT(symbol) {
  const latest = await PriceHistory.findOne({ symbol }).sort({ timestamp: -1 });
  const usdPrice = latest?.close ?? FALLBACK_USD_ANCHORS[symbol] ?? 100;
  return usdPrice * BDT_PER_USD;
}

/**
 * Get the most recent simulated price tick for a session+symbol.
 */
export async function getLatestSimulatedPrice(sessionId, symbol) {
  return SimulatedPriceTick.findOne({ sessionId, symbol }).sort({ generatedAt: -1 });
}

/**
 * Build a full price snapshot for all supported coins in a session.
 * Used when the client first subscribes — sends the most recent known price.
 */
export async function buildSimulatedSnapshot(session) {
  const coins = await Promise.all(
    SUPPORTED_SYMBOLS.map(async (symbol) => {
      const latestTick = await getLatestSimulatedPrice(session._id, symbol);
      const priceBDT = latestTick?.priceBDT ?? (await getAnchorPriceBDT(symbol));

      return {
        symbol,
        priceBDT,
        timestamp: latestTick?.generatedAt ?? session.startedAt,
        sourceWindow: session.sourceWindow,
      };
    })
  );

  return coins;
}

/**
 * Generate the next price tick for a single symbol using Geometric Brownian Motion.
 * The price is stored and emitted in BDT.
 */
export async function generateNextTick(session, symbol, now = new Date()) {
  const difficulty = normalizeDifficulty(session.difficulty);
  const preset = DIFFICULTY_PRESETS[difficulty];

  const previousTick = await getLatestSimulatedPrice(session._id, symbol);
  const previousPrice = previousTick?.priceBDT ?? (await getAnchorPriceBDT(symbol));

  // Use time-based step index so that the simulation is continuously advancing
  const stepIndex = Math.max(1, Math.floor((now.getTime() - session.startedAt.getTime()) / 1000));
  const randomShock = seededNormal(`${session.seed}:${symbol}:${stepIndex}`);
  const move = preset.drift + randomShock * preset.volatility;

  // Geometric Brownian Motion: S(t+1) = S(t) * exp(drift + vol * Z)
  const nextPrice = Math.max(0.0001, previousPrice * Math.exp(move));

  return {
    sessionId: session._id,
    symbol,
    priceBDT: Number(nextPrice.toFixed(8)),
    sourceWindow: session.sourceWindow,
    seed: session.seed,
    generatedAt: now,
  };
}

/**
 * Generate one tick for every supported symbol in a session, in parallel.
 */
export async function generateSessionTicks(session, now = new Date()) {
  return Promise.all(SUPPORTED_SYMBOLS.map((symbol) => generateNextTick(session, symbol, now)));
}
