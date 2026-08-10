import { env } from '../config/env.js';
import { SimulationSession } from '../models/SimulationSession.js';
import { SimulatedPriceTick } from '../models/SimulatedPriceTick.js';
import { generateSessionTicks } from '../services/simulation/engine.js';
import { emitMarketTicks } from '../socket/marketSocket.js';

let intervalId = null;
let isRunning = false;
let socketServer = null;

export async function advanceSimulationTicks() {
  if (isRunning) return;

  isRunning = true;
  const now = new Date();

  try {
    const sessions = await SimulationSession.find({ status: 'active' });
    const batches = await Promise.all(sessions.map((session) => generateSessionTicks(session, now)));
    const ticks = batches.flat();

    if (ticks.length > 0) {
      await SimulatedPriceTick.insertMany(ticks, { ordered: false });
    }

    sessions.forEach((session, index) => {
      emitMarketTicks(socketServer, session.userId.toString(), batches[index]);
    });
  } finally {
    isRunning = false;
  }
}

export function startSimulationTickJob(io) {
  socketServer = io;

  if (intervalId) return intervalId;

  intervalId = setInterval(() => {
    advanceSimulationTicks().catch((err) => {
      console.error('Simulation tick job failed:', err);
    });
  }, env.PRICE_TICK_INTERVAL_MS);

  intervalId.unref?.();
  return intervalId;
}
