import mongoose from 'mongoose';
import { Wallet } from '../models/Wallet.js';
import { SimulationSession } from '../models/SimulationSession.js';
import { MarketEventLog } from '../models/MarketEventLog.js';
import { SimulatedPriceTick } from '../models/SimulatedPriceTick.js';
import { getLatestSimulatedPrice, getAnchorPriceBDT, getSessionPercentChange24h } from './simulation/engine.js';
import { seededUnit } from './simulation/seededRandom.js';
import { emitMarketTicks } from '../socket/marketSocket.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES, SUPPORTED_SYMBOLS } from '../constants/index.js';
import { env } from '../config/env.js';

const COOLDOWN_MS = 30_000;
const IMPACT_JITTER = 0.15; // +/-15% of the magnitude, so "ALL" events don't move every coin identically

function costForImpact(impactPercent) {
  return Math.round(Math.abs(impactPercent) * 5);
}

export const MARKET_EVENTS = [
  {
    code: 'BAD_TWEET_BNB',
    title: 'Influencer tweets bad about BNB',
    description: 'A big-account influencer posts a scathing thread about BNB. Traders react fast.',
    symbols: ['BNB'],
    impactPercent: -3,
  },
  {
    code: 'UK_BANS_CRYPTO',
    title: 'UK bans crypto',
    description: 'The UK announces a blanket ban on cryptocurrency trading.',
    symbols: ['ALL'],
    impactPercent: -5,
  },
  {
    code: 'USA_BOMBS_NORWAY',
    title: 'USA bombs Norway',
    description: 'Shock geopolitical news sends risk assets tumbling across the board.',
    symbols: ['ALL'],
    impactPercent: -6,
  },
  {
    code: 'GERMANY_ADDS_CRYPTO_PAYMENTS',
    title: 'Germany adds crypto payments',
    description: 'Germany announces official support for crypto payments nationwide.',
    symbols: ['ALL'],
    impactPercent: 9,
  },
  {
    code: 'DOGE_MEME_VIRAL',
    title: 'DOGE meme goes viral',
    description: 'A DOGE meme explodes across social media overnight.',
    symbols: ['DOGE'],
    impactPercent: 11,
  },
  {
    code: 'COVID_2',
    title: 'Covid 2.0',
    description: 'A new global outbreak spooks every market, crypto included.',
    symbols: ['ALL'],
    impactPercent: -12,
  },
  {
    code: 'ELON_NAMES_NEWBORN_SOL',
    title: 'Elon names his newborn "XOL"',
    description: 'The internet decides this is basically a SOL endorsement.',
    symbols: ['SOL'],
    impactPercent: 17,
  },
  {
    code: 'EXCHANGE_HACKED',
    title: 'Exchange gets hacked',
    description: 'A major exchange reports a large-scale security breach.',
    symbols: ['ALL'],
    impactPercent: -24,
  },
  {
    code: 'WHALE_BUYS_SOL',
    title: 'Warner Co. bulk-buys SOL',
    description: 'A single institutional buyer scoops up a massive SOL position.',
    symbols: ['SOL'],
    impactPercent: 43,
  },
].map((event) => ({ ...event, costPoints: costForImpact(event.impactPercent) }));

const EVENTS_BY_CODE = new Map(MARKET_EVENTS.map((event) => [event.code, event]));

function resolveAffectedSymbols(event) {
  return event.symbols.includes('ALL') ? SUPPORTED_SYMBOLS : event.symbols;
}

async function assertCooldownElapsed(userId) {
  const lastEvent = await MarketEventLog.findOne({ userId }).sort({ triggeredAt: -1 });
  if (!lastEvent) return;

  const elapsedMs = Date.now() - lastEvent.triggeredAt.getTime();
  if (elapsedMs < COOLDOWN_MS) {
    throw new AppError(
      `Another market event was just triggered — wait ${Math.ceil((COOLDOWN_MS - elapsedMs) / 1000)}s`,
      409,
      ERROR_CODES.CONFLICT
    );
  }
}

/**
 * Apply an event's price shock to a session's live tick stream and log it.
 * Shared by both the paid (user) and free (ambient) trigger paths.
 */
async function applyPriceShock(session, event, { source, io }) {
  const symbols = resolveAffectedSymbols(event);
  const now = new Date();

  const ticks = await Promise.all(
    symbols.map(async (symbol) => {
      const previousTick = await getLatestSimulatedPrice(session._id, symbol);
      const previousPrice = previousTick?.priceBDT ?? (await getAnchorPriceBDT(symbol));

      const jitterUnit = seededUnit(`event:${session._id}:${event.code}:${symbol}:${now.getTime()}`);
      const jitteredPercent = event.impactPercent * (1 + (jitterUnit * 2 - 1) * IMPACT_JITTER);
      const priceBDT = Math.max(0.0001, previousPrice * (1 + jitteredPercent / 100));

      return { sessionId: session._id, symbol, priceBDT: Number(priceBDT.toFixed(8)), generatedAt: now };
    })
  );

  await SimulatedPriceTick.insertMany(ticks, { ordered: false });

  if (io) {
    // Piggyback the freshly-shocked 24h change onto this push — it's the one
    // moment a user is actually watching for the number to move, so it's
    // worth computing here even though the routine 3s tick job doesn't.
    const emitTicks = await Promise.all(
      ticks.map(async (tick) => ({
        ...tick,
        percentChange24h: await getSessionPercentChange24h(session, tick.symbol, tick.priceBDT),
      }))
    );
    emitMarketTicks(io, session.userId.toString(), emitTicks);
  }

  return MarketEventLog.create({
    sessionId: session._id,
    userId: session.userId,
    code: event.code,
    title: event.title,
    symbols,
    impactPercent: event.impactPercent,
    costPoints: source === 'user' ? event.costPoints : 0,
    source,
    triggeredAt: now,
  });
}

/**
 * Pay virtual points to fire a market event on the caller's own simulated session.
 */
export async function triggerEvent({ userId, code, io }) {
  const session = await SimulationSession.findOne({ userId, status: 'active' });
  if (!session) {
    throw new AppError('No active simulation session for this user', 409, ERROR_CODES.CONFLICT);
  }
  if (session.mode !== 'simulated') {
    throw new AppError('Market events are only available in Simulated mode', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const event = EVENTS_BY_CODE.get(code);
  if (!event) {
    throw new AppError(`Unknown market event "${code}"`, 404, ERROR_CODES.NOT_FOUND);
  }

  await assertCooldownElapsed(userId);

  const mongoSession = await mongoose.startSession();
  let wallet;
  try {
    await mongoSession.withTransaction(async () => {
      wallet = await Wallet.findOne({ userId }).session(mongoSession);
      if (!wallet) {
        throw new AppError('Wallet not found', 404, ERROR_CODES.NOT_FOUND);
      }
      if (wallet.virtualPoints < event.costPoints) {
        throw new AppError('Not enough points to trigger this event', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      wallet.virtualPoints -= event.costPoints;
      await wallet.save({ session: mongoSession });
    });
  } finally {
    await mongoSession.endSession();
  }

  const log = await applyPriceShock(session, event, { source: 'user', io });
  return { event: log, wallet };
}

/**
 * Roll the odds for this session and, if it hits, fire a random catalog
 * event for free. Never throws — called from a background job with nothing
 * to report failure to besides the console.
 */
export async function maybeTriggerAmbientEvent(session, io) {
  try {
    const lastEvent = await MarketEventLog.findOne({ userId: session.userId }).sort({ triggeredAt: -1 });
    if (lastEvent && Date.now() - lastEvent.triggeredAt.getTime() < COOLDOWN_MS) return;

    if (Math.random() >= env.AMBIENT_EVENT_PROBABILITY) return;

    const event = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
    await applyPriceShock(session, event, { source: 'ambient', io });
  } catch (err) {
    console.error(`[ambientEvent] Failed for session ${session._id}:`, err.message);
  }
}

export async function getRecentEvents(userId, limit = 20) {
  return MarketEventLog.find({ userId }).sort({ triggeredAt: -1 }).limit(limit);
}
