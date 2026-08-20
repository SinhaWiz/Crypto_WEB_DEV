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
 * Open a leveraged long or short position.
 */
export const openPosition = async ({ symbol, side, quantity, leverage }) => {
  return httpClient.post('/api/positions/open', { symbol, side, quantity, leverage });
};

/**
 * Close an existing leveraged position.
 */
export const closePosition = async ({ symbol, side, quantity }) => {
  return httpClient.post('/api/positions/close', { symbol, side, quantity });
};

/**
 * Fetch open leveraged positions for the current account.
 */
export const getOpenPositions = async () => {
  return httpClient.get('/api/positions');
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
