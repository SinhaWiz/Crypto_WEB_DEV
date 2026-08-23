import { env } from '../config/env.js';
import { SimulationSession } from '../models/SimulationSession.js';
import { maybeTriggerAmbientEvent } from '../services/marketEventService.js';

let intervalId = null;
let isRunning = false;
let socketServer = null;

/**
 * Give every active simulated-mode session an independent roll for a
 * free, random market event. Each session's own cooldown/probability check
 * lives in maybeTriggerAmbientEvent — this job just fans the check out.
 */
export async function advanceAmbientEvents() {
  if (isRunning) return;

  isRunning = true;

  try {
    const sessions = await SimulationSession.find({ status: 'active', mode: 'simulated' });
    if (sessions.length === 0) return;

    await Promise.all(sessions.map((session) => maybeTriggerAmbientEvent(session, socketServer)));
  } catch (error) {
    console.error('[JOB] ambientEventJob error:', error.message);
  } finally {
    isRunning = false;
  }
}

export function startAmbientEventJob(io) {
  socketServer = io;

  if (intervalId) return; // already running

  const intervalMs = env.AMBIENT_EVENT_CHECK_MS || 60000;

  intervalId = setInterval(() => {
    advanceAmbientEvents().catch((err) => {
      console.error('[JOB] Unhandled ambient event error:', err.message);
    });
  }, intervalMs);

  intervalId.unref?.();

  console.log(`[JOB] ambientEventJob started with interval ${intervalMs}ms`);
}
