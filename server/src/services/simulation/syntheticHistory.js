import { seededUnit, seededNormal } from './seededRandom.js';

// Rough per-coin volatility character so each symbol's history has a
// visibly different shape, not just a different price scale.
const SYMBOL_VOLATILITY = {
  BTC: 0.018,
  ETH: 0.026,
  SOL: 0.045,
  DOGE: 0.06,
  XRP: 0.035,
  BNB: 0.03,
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Generate `days` days of synthetic OHLC candles (in USD) for a symbol via a
 * seeded random walk, independently per symbol so coins don't all trace the
 * same shape. The walk is rescaled so the most recent candle's close lands
 * exactly on `anchorPriceUsd` — a real, current price fetched from CoinGecko.
 */
export function generateSyntheticHistory(symbol, { days = 30, anchorPriceUsd, seedPrefix = 'seed-history', now = new Date() } = {}) {
  const volatility = SYMBOL_VOLATILITY[symbol] ?? 0.03;

  const closes = [1];
  for (let i = 1; i < days; i += 1) {
    const shock = seededNormal(`${seedPrefix}:${symbol}:${i}`);
    closes.push(closes[i - 1] * Math.exp(shock * volatility));
  }

  const scale = anchorPriceUsd / closes[closes.length - 1];

  return closes.map((rawClose, i) => {
    const close = rawClose * scale;
    const open = i === 0 ? close : closes[i - 1] * scale;
    const rangeSeed = seededUnit(`${seedPrefix}:${symbol}:${i}:range`);
    const range = Math.max(open, close) * (0.004 + rangeSeed * 0.01);

    return {
      timestamp: new Date(now.getTime() - (days - 1 - i) * DAY_MS),
      open,
      high: Math.max(open, close) + range,
      low: Math.max(0, Math.min(open, close) - range),
      close,
      volume: 0,
    };
  });
}
