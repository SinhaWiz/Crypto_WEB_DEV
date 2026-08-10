import { Achievement } from '../models/Achievement.js';
import { PortfolioHolding } from '../models/PortfolioHolding.js';
import { PredictionChallenge } from '../models/PredictionChallenge.js';
import { Transaction } from '../models/Transaction.js';

export const ACHIEVEMENT_DEFINITIONS = [
  {
    code: 'first_trade',
    title: 'First Trade',
    description: 'Completed a simulated market buy or sell.',
  },
  {
    code: 'first_prediction',
    title: 'First Forecast',
    description: 'Opened a virtual prediction challenge.',
  },
  {
    code: 'portfolio_builder',
    title: 'Portfolio Builder',
    description: 'Held at least three different simulated coins.',
  },
  {
    code: 'prediction_winner',
    title: 'Called It',
    description: 'Won a virtual prediction challenge.',
  },
];

async function unlock(userId, code) {
  await Achievement.updateOne(
    { userId, code },
    { $setOnInsert: { userId, code, unlockedAt: new Date() } },
    { upsert: true }
  );
}

export async function evaluateAchievements(userId) {
  const [tradeCount, predictionCount, holdingCount, winningPredictionCount] = await Promise.all([
    Transaction.countDocuments({ userId }),
    PredictionChallenge.countDocuments({ userId }),
    PortfolioHolding.countDocuments({ userId, quantity: { $gt: 0 } }),
    PredictionChallenge.countDocuments({ userId, result: 'won' }),
  ]);

  const unlocks = [];
  if (tradeCount > 0) unlocks.push(unlock(userId, 'first_trade'));
  if (predictionCount > 0) unlocks.push(unlock(userId, 'first_prediction'));
  if (holdingCount >= 3) unlocks.push(unlock(userId, 'portfolio_builder'));
  if (winningPredictionCount > 0) unlocks.push(unlock(userId, 'prediction_winner'));

  await Promise.all(unlocks);
}

export async function listAchievements(userId) {
  const unlocked = await Achievement.find({ userId });
  const unlockedByCode = new Map(unlocked.map((achievement) => [achievement.code, achievement]));

  return ACHIEVEMENT_DEFINITIONS.map((definition) => {
    const achievement = unlockedByCode.get(definition.code);
    return {
      ...definition,
      unlocked: Boolean(achievement),
      unlockedAt: achievement?.unlockedAt ?? null,
    };
  });
}
