import { env } from '../config/env.js';
import { SimulationSession } from '../models/SimulationSession.js';
import { SimulatedPriceTick } from '../models/SimulatedPriceTick.js';
import { generateSessionTicks } from '../services/simulation/engine.js';
import { emitMarketTicks } from '../socket/marketSocket.js';

let intervalId = null;
let isRunning = false;
let socketServer = null;

/**
 * Advance the simulation by one tick for every active session.
 * Generates ticks for all 6 symbols per user in one batch,
 * persists them to DB, then emits to each user's socket room.
 */
export async function advanceSimulationTicks() {
  // Guard against overlapping runs if the interval fires before the previous one completes
  if (isRunning) return;

  isRunning = true;
  const now = new Date();

  try {
    const sessions = await SimulationSession.find({ status: 'active' });
    if (sessions.length === 0) return;

    // Generate ticks for all sessions in parallel
    const batches = await Promise.all(
      sessions.map((session) => generateSessionTicks(session, now))
    );

    // Persist all ticks at once
    const allTicks = batches.flat();
    if (allTicks.length > 0) {
      await SimulatedPriceTick.insertMany(allTicks, { ordered: false });
    }

    // Emit each user's batch as a single { prices: [...] } event
    if (socketServer) {
      sessions.forEach((session, index) => {
        emitMarketTicks(socketServer, session.userId.toString(), batches[index]);
      });
    }
  } catch (error) {
    console.error('[JOB] simulationTickJob error:', error.message);
  } finally {
    isRunning = false;
  }
}

export function startSimulationTickJob(io) {
  socketServer = io;

  if (intervalId) return; // already running

  const intervalMs = env.PRICE_TICK_INTERVAL_MS || 3000;

  intervalId = setInterval(() => {
    advanceSimulationTicks().catch((err) => {
      console.error('[JOB] Unhandled tick error:', err.message);
    });
  }, intervalMs);

  // Allow Node.js to exit even if the interval is still scheduled
  intervalId.unref?.();

  console.log(`[JOB] simulationTickJob started with interval ${intervalMs}ms`);
}
