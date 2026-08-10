import { env } from '../config/env.js';
import { SimulationSession } from '../models/SimulationSession.js';
import { SimulatedPriceTick } from '../models/SimulatedPriceTick.js';
import { generateSessionTicks } from '../services/simulation/engine.js';

let intervalId = null;
let isRunning = false;

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
  } finally {
    isRunning = false;
  }
}

export function startSimulationTickJob() {
  if (intervalId) return intervalId;

  intervalId = setInterval(() => {
    advanceSimulationTicks().catch((err) => {
      console.error('Simulation tick job failed:', err);
    });
  }, env.PRICE_TICK_INTERVAL_MS);

  intervalId.unref?.();
  return intervalId;
}
