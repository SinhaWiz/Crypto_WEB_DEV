import seedrandom from 'seedrandom';

/**
 * Difficulty presets dictate the volatility (how much prices swing)
 * and drift (general trend direction, usually 0 for a fair game).
 */
const DIFFICULTY_PRESETS = {
  beginner: { volatility: 0.001, drift: 0 },
  intermediate: { volatility: 0.003, drift: 0 },
  expert: { volatility: 0.008, drift: 0 },
};

/**
 * Deterministically calculate the next price using Geometric Brownian Motion.
 * 
 * @param {number} currentPrice - The coin's current price
 * @param {string} seed - The session seed, combined with a nonce to keep advancing
 * @param {number} nonce - The step counter (tick index)
 * @param {string} difficulty - Session difficulty preset
 * @returns {number} The newly calculated price
 */
export function generateNextTickPrice(currentPrice, seed, nonce, difficulty = 'beginner') {
  // We use seed + nonce so that generating the Nth tick is perfectly reproducible
  // if we ever need to recalculate from scratch.
  const rng = seedrandom(`${seed}-${nonce}`);
  
  // Standard Normal Distribution using Box-Muller transform
  const u1 = rng();
  const u2 = rng();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  const { volatility, drift } = DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS.beginner;

  // Geometric Brownian Motion step
  // dS = S * (drift * dt + volatility * dW)
  // We treat dt as 1 step.
  const delta = currentPrice * (drift + volatility * z0);
  const nextPrice = currentPrice + delta;

  // Prevent price from going to zero or negative
  return Math.max(nextPrice, 0.00000001);
}
