import { registerMarketDataAdapter } from './adapter.js';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

const SYMBOL_TO_COINGECKO_ID = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  DOGE: 'dogecoin',
  XRP: 'ripple',
  BNB: 'binancecoin',
};

// CoinGecko's free /ohlc endpoint only accepts a handful of day windows and
// auto-selects the candle granularity for us (no vs_currency interval param).
const INTERVAL_TO_DAYS = {
  '5m': 1,
  '1h': 7,
  '1d': 90,
};

function toCoinGeckoId(symbol) {
  const id = SYMBOL_TO_COINGECKO_ID[symbol];
  if (!id) {
    throw new Error(`No CoinGecko id mapping for symbol "${symbol}"`);
  }
  return id;
}

async function fetchHistory({ symbol, interval }) {
  const id = toCoinGeckoId(symbol);
  const days = INTERVAL_TO_DAYS[interval] ?? 30;
  const url = `${COINGECKO_BASE_URL}/coins/${id}/ohlc?vs_currency=usd&days=${days}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko request failed (${response.status}): ${url}`);
  }

  const rows = await response.json();

  // The free /ohlc endpoint doesn't return volume; PriceHistory.volume
  // defaults to 0 for candles from this provider.
  return rows.map(([timestampMs, open, high, low, close]) => ({
    symbol,
    timestamp: new Date(timestampMs),
    open,
    high,
    low,
    close,
    volume: 0,
  }));
}

export const coinGeckoProvider = {
  name: 'coingecko',
  fetchHistory,
};

registerMarketDataAdapter(coinGeckoProvider);
