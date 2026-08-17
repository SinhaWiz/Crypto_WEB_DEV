import { httpClient } from './httpClient';

/**
 * Fetch the current user's wallet. Returns { wallet }.
 */
export const getWallet = async () => {
  return httpClient.get('/api/wallet');
};

/**
 * Buy virtual points with cash balance (1 point = 10,000 taka). Returns { wallet }.
 */
export const buyPoints = async ({ pointsToBuy }) => {
  return httpClient.post('/api/wallet/buy-points', { pointsToBuy });
};
