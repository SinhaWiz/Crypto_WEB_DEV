import { httpClient } from './httpClient';

/**
 * Fetch the latest snapshot for all 6 supported coins.
 * Returns an array of { symbol, priceBDT, priceUSD, percentChange24h, volume24h, marketCap, timestamp }.
 */
export const listCoins = async () => {
  const response = await httpClient.get('/api/coins');
  return response.coins;
};

/**
 * Fetch the latest snapshot for a single coin by symbol.
 */
export const getCoin = async (symbol) => {
  const response = await httpClient.get(`/api/coins/${symbol}`);
  return response.coin;
};

/**
 * Fetch historical candles for a symbol (sorted oldest-first, prices in BDT).
 * Returns an array of { timestamp, open, high, low, close, volume }.
 */
export const getCoinHistory = async (symbol) => {
  const response = await httpClient.get(`/api/coins/${symbol}/history`);
  return response.candles;
};

/**
 * Manually trigger a CoinGecko price refresh (admin/dev use).
 */
export const refreshPrices = async () => {
  const response = await httpClient.post('/api/coins/refresh');
  return response;
};
