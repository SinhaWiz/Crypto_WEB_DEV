/**
 * Interface for Market Data Providers
 */
export class MarketDataAdapter {
  /**
   * Fetch historical OHLCV data
   * @param {string} symbol - e.g. BTC
   * @param {string} interval - e.g. '1d' or '1h'
   * @param {number} days - number of days of history to fetch
   * @returns {Promise<Array>} Array of OHLCV objects
   */
  async fetchHistory(symbol, interval, days) {
    throw new Error('fetchHistory() must be implemented by subclass');
  }

  /**
   * Fetch latest price and metrics snapshot
   * @param {string[]} symbols - Array of symbols
   * @returns {Promise<Array>} Array of snapshot objects
   */
  async fetchLatest(symbols) {
    throw new Error('fetchLatest() must be implemented by subclass');
  }
}
