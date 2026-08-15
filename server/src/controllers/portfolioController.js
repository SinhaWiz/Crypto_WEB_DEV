import { getPortfolioSummary } from '../services/portfolioService.js';

export async function getPortfolio(req, res) {
  const summary = await getPortfolioSummary(req.user.id);
  res.json(summary);
}
