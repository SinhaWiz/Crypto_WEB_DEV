import { PortfolioHolding } from '../models/PortfolioHolding.js';
import { SimulationSession } from '../models/SimulationSession.js';
import { getLatestSimulatedPrice, getAnchorPriceBDT } from './simulation/engine.js';

/**
 * Resolve the current live price (BDT) for a symbol against the user's
 * own simulation session, falling back to the historical anchor price.
 */
async function getLivePriceBDT(session, symbol) {
  if (!session) {
    return getAnchorPriceBDT(symbol);
  }
  const latestTick = await getLatestSimulatedPrice(session._id, symbol);
  return latestTick?.priceBDT ?? (await getAnchorPriceBDT(symbol));
}

/**
 * Build the user's full portfolio: each holding valued at the current
 * live simulated price, plus aggregate totals.
 */
export async function getPortfolioSummary(userId) {
  const holdings = await PortfolioHolding.find({ userId, quantity: { $gt: 0 } });
  if (holdings.length === 0) {
    return { holdings: [], totalValueBDT: 0, totalCostBDT: 0, totalUnrealizedPnlBDT: 0 };
  }

  const session = await SimulationSession.findOne({ userId, status: 'active' });

  const enriched = await Promise.all(
    holdings.map(async (holding) => {
      const currentPriceBDT = await getLivePriceBDT(session, holding.symbol);
      const marketValueBDT = currentPriceBDT * holding.quantity;
      const costBasisBDT = holding.averageBuyPriceBDT * holding.quantity;
      const unrealizedPnlBDT = marketValueBDT - costBasisBDT;
      const unrealizedPnlPercent = costBasisBDT > 0 ? (unrealizedPnlBDT / costBasisBDT) * 100 : 0;

      return {
        symbol: holding.symbol,
        quantity: holding.quantity,
        averageBuyPriceBDT: holding.averageBuyPriceBDT,
        currentPriceBDT,
        marketValueBDT,
        costBasisBDT,
        unrealizedPnlBDT,
        unrealizedPnlPercent,
        realizedPnlBDT: holding.realizedPnlBDT,
      };
    })
  );

  const totalValueBDT = enriched.reduce((sum, h) => sum + h.marketValueBDT, 0);
  const totalCostBDT = enriched.reduce((sum, h) => sum + h.costBasisBDT, 0);
  const totalUnrealizedPnlBDT = totalValueBDT - totalCostBDT;

  return { holdings: enriched, totalValueBDT, totalCostBDT, totalUnrealizedPnlBDT };
}
