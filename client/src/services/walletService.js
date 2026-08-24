import { httpClient } from './httpClient';

/**
 * Fetch the current user's wallet. Returns { wallet, stipend: { eligible, lowBalance, availableAt, amount } }.
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

/**
 * Claim the free daily top-up when the wallet is too low to do anything.
 * Returns { wallet, stipend }.
 */
export const claimStipend = async () => {
  return httpClient.post('/api/wallet/stipend');
};
