import { SimulationSession } from '../models/SimulationSession.js';

const MODE_TO_PROVIDER = { simulated: 'synthetic', real: 'coingecko' };

/**
 * Resolve which PriceHistory dataset a request should read from, based on
 * the requesting user's SimulationSession.mode. Anonymous requests (no
 * userId) default to the synthetic dataset, same as the account default.
 */
export async function getUserPriceProvider(userId) {
  if (!userId) return 'synthetic';
  const session = await SimulationSession.findOne({ userId }).select('mode');
  return MODE_TO_PROVIDER[session?.mode] ?? 'synthetic';
}
