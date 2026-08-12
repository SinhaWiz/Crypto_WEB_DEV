import { env } from '../config/env.js';
import { SimulationSession } from '../models/SimulationSession.js';
import { SimulatedPriceTick } from '../models/SimulatedPriceTick.js';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';
import { generateNextTickPrice } from '../services/simulation/engine.js';
import { getLatestPrices } from '../services/coinService.js';

let ioInstance = null;

export const setIoInstance = (io) => {
  ioInstance = io;
};

export const startSimulationTickJob = () => {
  const intervalMs = env.PRICE_TICK_INTERVAL_MS || 3000;
  
  setInterval(async () => {
    try {
      const activeSessions = await SimulationSession.find({ status: 'active' });
      if (!activeSessions.length) return;

      const latestPrices = await getLatestPrices(); // To anchor new sessions
      const newTicks = [];
      const emits = [];

      for (const session of activeSessions) {
        for (const symbol of SUPPORTED_SYMBOLS) {
          // Find the last tick for this symbol in this session
          const lastTick = await SimulatedPriceTick.findOne({ 
            sessionId: session._id, 
            symbol 
          }).sort({ generatedAt: -1 });

          let currentPrice;
          let nonce;

          if (lastTick) {
            currentPrice = lastTick.priceBDT;
            // Hacky nonce: we can use the count of ticks as the nonce
            nonce = await SimulatedPriceTick.countDocuments({ sessionId: session._id, symbol });
          } else {
            // Anchor to latest price history
            const anchor = latestPrices.find(p => p.symbol === symbol);
            currentPrice = anchor ? anchor.close : 100; // fallback to 100 if no history
            nonce = 0;
          }

          const nextPrice = generateNextTickPrice(currentPrice, session.seed, nonce, session.difficulty);

          const newTick = {
            sessionId: session._id,
            symbol,
            priceBDT: nextPrice,
            generatedAt: new Date(),
          };

          newTicks.push(newTick);

          // We will emit the new tick to the specific user's room
          emits.push({
            userId: session.userId.toString(),
            tick: newTick
          });
        }
      }

      if (newTicks.length > 0) {
        await SimulatedPriceTick.insertMany(newTicks);

        if (ioInstance) {
          for (const emit of emits) {
            ioInstance.to(`user:${emit.userId}`).emit('market:tick', emit.tick);
          }
        }
      }

    } catch (error) {
      console.error(`[JOB] Error in simulationTickJob:`, error.message);
    }
  }, intervalMs);
  
  console.log(`[JOB] simulationTickJob started with interval ${intervalMs}ms`);
};
