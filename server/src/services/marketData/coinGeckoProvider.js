import { MarketDataAdapter } from './adapter.js';

export const getCoinGeckoId = (symbol) => {
  const map = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    SOL: 'solana',
    DOGE: 'dogecoin',
    XRP: 'ripple',
    BNB: 'binancecoin',
  };
  return map[symbol];
};

class CoinGeckoProvider extends MarketDataAdapter {
  async fetchHistory(symbol, interval, days) {
    const id = getCoinGeckoId(symbol);
    if (!id) throw new Error(`Unsupported symbol: ${symbol}`);
    
    // CoinGecko API: /coins/{id}/ohlc?vs_currency=usd&days={days}
    const url = `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=${days}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko OHLC API error: ${response.statusText}`);
      }
      const data = await response.json();
      
      // CoinGecko returns array of arrays: [ [timestamp, open, high, low, close], ... ]
      return data.map(candle => ({
        timestamp: new Date(candle[0]),
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: 0 // OHLC endpoint doesn't return volume. We'd have to fetch market_chart for volume. We default to 0.
      }));
    } catch (error) {
      console.error(`Error fetching OHLC data from CoinGecko for ${symbol}:`, error.message);
      throw error;
    }
  }

  async fetchLatest(symbols) {
    const ids = symbols.map(getCoinGeckoId).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko Simple Price API error: ${response.statusText}`);
      }
      const data = await response.json();
      
      const results = [];
      for (const symbol of symbols) {
        const id = getCoinGeckoId(symbol);
        const coinData = data[id];
        if (coinData) {
          results.push({
            symbol,
            price: coinData.usd,
            marketCap: coinData.usd_market_cap,
            volume24h: coinData.usd_24h_vol,
            percentChange24h: coinData.usd_24h_change,
          });
        }
      }
      return results;
    } catch (error) {
      console.error('Error fetching latest market data from CoinGecko:', error.message);
      throw error;
    }
  }
}

export const coinGeckoProvider = new CoinGeckoProvider();
