/**
 * @typedef {Object} Candle
 * @property {string} symbol
 * @property {Date} timestamp
 * @property {number} open
 * @property {number} high
 * @property {number} low
 * @property {number} close
 * @property {number} volume
 */

/**
 * A market-data adapter normalizes one provider's historical-price API into
 * an array of Candle objects. Concrete providers (e.g. CoinGecko) implement
 * this shape so the provider can be swapped later without touching callers.
 *
 * @typedef {Object} MarketDataAdapter
 * @property {string} name
 * @property {(params: { symbol: string, interval: string, range: { from: Date, to: Date } }) => Promise<Candle[]>} fetchHistory
 */

const registry = new Map();

/** @param {MarketDataAdapter} adapter */
export function registerMarketDataAdapter(adapter) {
  registry.set(adapter.name, adapter);
}

/** @returns {MarketDataAdapter} */
export function getMarketDataAdapter(name) {
  const adapter = registry.get(name);
  if (!adapter) {
    throw new Error(`No market-data adapter registered for provider "${name}"`);
  }
  return adapter;
}
