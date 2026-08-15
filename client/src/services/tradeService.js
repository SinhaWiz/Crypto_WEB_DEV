import { httpClient } from './httpClient';

/**
 * Execute a market buy. Returns { wallet, holding, transaction }.
 */
export const buyCoin = async ({ symbol, quantity }) => {
  return httpClient.post('/api/trades/buy', { symbol, quantity });
};

/**
 * Execute a market sell. Returns { wallet, holding, transaction }.
 */
export const sellCoin = async ({ symbol, quantity }) => {
  return httpClient.post('/api/trades/sell', { symbol, quantity });
};

/**
 * Fetch the user's portfolio: holdings valued at live simulated prices,
 * plus aggregate totals. Returns { holdings, totalValueBDT, totalCostBDT, totalUnrealizedPnlBDT }.
 */
export const getPortfolio = async () => {
  return httpClient.get('/api/portfolio');
};

/**
 * Fetch paginated transaction history.
 * Returns { transactions, page, limit, total, totalPages }.
 */
export const getTransactions = async ({ page = 1, limit = 20 } = {}) => {
  return httpClient.get('/api/transactions', { params: { page, limit } });
};
