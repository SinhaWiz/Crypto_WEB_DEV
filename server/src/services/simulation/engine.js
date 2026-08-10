import crypto from 'crypto';
import { SUPPORTED_SYMBOLS } from '../../constants/index.js';
import { PriceHistory } from '../../models/PriceHistory.js';
import { SimulatedPriceTick } from '../../models/SimulatedPriceTick.js';

const BDT_PER_USD = 120;

const FALLBACK_USD_ANCHORS = {
  BTC: 65000,
  ETH: 3500,
  SOL: 150,
  DOGE: 0.14,
  XRP: 0.6,
  BNB: 600,
};

const DIFFICULTY_PRESETS = {
  easy: { volatility: 0.0025, drift: 0.00005 },
  medium: { volatility: 0.006, drift: 0.0001 },
  hard: { volatility: 0.012, drift: 0.00015 },
};

function normalizeDifficulty(difficulty) {
  return DIFFICULTY_PRESETS[difficulty] ? difficulty : 'medium';
}

function seededUnit(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest();
  return hash.readUInt32BE(0) / 0xffffffff;
}

function seededNormal(seed) {
  const u1 = Math.max(seededUnit(`${seed}:a`), Number.EPSILON);
  const u2 = Math.max(seededUnit(`${seed}:b`), Number.EPSILON);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function createSimulationSeed(userId) {
  return crypto.createHash('sha256').update(`${userId}:${crypto.randomUUID()}`).digest('hex').slice(0, 24);
}

export async function getAnchorPriceBDT(symbol) {
  const latest = await PriceHistory.findOne({ symbol }).sort({ timestamp: -1 });
  const usdPrice = latest?.close ?? FALLBACK_USD_ANCHORS[symbol];
  return usdPrice * BDT_PER_USD;
}

export async function getLatestSimulatedPrice(sessionId, symbol) {
  return SimulatedPriceTick.findOne({ sessionId, symbol }).sort({ generatedAt: -1 });
}

export async function buildSimulatedSnapshot(session) {
  const coins = await Promise.all(
    SUPPORTED_SYMBOLS.map(async (symbol) => {
      const latestTick = await getLatestSimulatedPrice(session._id, symbol);
      const priceBDT = latestTick?.priceBDT ?? (await getAnchorPriceBDT(symbol));

      return {
        symbol,
        priceBDT,
        timestamp: latestTick?.generatedAt ?? session.startedAt,
        sourceWindow: latestTick?.sourceWindow ?? session.sourceWindow,
      };
    })
  );

  return coins;
}

export async function generateNextTick(session, symbol, now = new Date()) {
  const difficulty = normalizeDifficulty(session.difficulty);
  const preset = DIFFICULTY_PRESETS[difficulty];
  const previousTick = await getLatestSimulatedPrice(session._id, symbol);
  const previousPrice = previousTick?.priceBDT ?? (await getAnchorPriceBDT(symbol));
  const stepIndex = Math.max(1, Math.floor((now.getTime() - session.startedAt.getTime()) / 1000));
  const randomShock = seededNormal(`${session.seed}:${symbol}:${stepIndex}`);
  const move = preset.drift + randomShock * preset.volatility;
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

export async function generateSessionTicks(session, now = new Date()) {
  return Promise.all(SUPPORTED_SYMBOLS.map((symbol) => generateNextTick(session, symbol, now)));
}
