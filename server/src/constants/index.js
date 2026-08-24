export const SUPPORTED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'BNB'];

export const MIN_LEVERAGE = 1;

export const MAX_LEVERAGE = 10;

export const POSITION_SIDES = ['long', 'short'];

export const STARTING_BALANCE_BDT = 100000;

export const STARTING_VIRTUAL_POINTS = 100;

export const BDT_PER_USD = 120;

export const TRADE_FEE_RATE = 0.008;

export const POINTS_EXCHANGE_RATE_BDT = 1000;

// Daily stipend — a free top-up for users whose wallet is too low to do
// anything (can't afford to trade, can't afford to bet/trigger an event, and
// can't buy more points because cash is also low). Only available once every
// 24h, and only when BOTH currencies are below their threshold, so it can't
// be farmed as a steady income by a wallet that's still functional.
export const STIPEND_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const STIPEND_ELIGIBLE_CASH_BDT = 5000;
export const STIPEND_ELIGIBLE_POINTS = 10;
export const STIPEND_CASH_BDT = 10000;
export const STIPEND_POINTS = 20;

export const DISCLAIMER_TEXT =
  'Educational simulator only. All balances, trades, prices, and rewards are virtual; no real cryptocurrency or financial transaction occurs.';

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

export const AUTH_COOKIE_NAME = 'token';
