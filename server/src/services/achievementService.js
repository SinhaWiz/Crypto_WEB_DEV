import { Achievement } from '../models/Achievement.js';
import { Transaction } from '../models/Transaction.js';
import { PredictionChallenge } from '../models/PredictionChallenge.js';
import { Wallet } from '../models/Wallet.js';
import { STARTING_BALANCE_BDT } from '../constants/index.js';

export const ACHIEVEMENT_DEFINITIONS = [
  {
    code: 'FIRST_TRADE',
    title: 'First Trade',
    description: 'Execute your first buy or sell order.',
    check: async (userId) => (await Transaction.countDocuments({ userId })) >= 1,
  },
  {
    code: 'FIVE_TRADES',
    title: 'Active Trader',
    description: 'Execute 5 trades.',
    check: async (userId) => (await Transaction.countDocuments({ userId })) >= 5,
  },
  {
    code: 'FIRST_PREDICTION',
    title: 'Fortune Teller',
    description: 'Place your first prediction challenge.',
    check: async (userId) => (await PredictionChallenge.countDocuments({ userId })) >= 1,
  },
  {
    code: 'PREDICTION_WINNER',
    title: 'Called It',
    description: 'Win your first prediction challenge.',
    check: async (userId) => (await PredictionChallenge.countDocuments({ userId, result: 'win' })) >= 1,
  },
  {
    code: 'FIVE_WINS',
    title: 'Market Oracle',
    description: 'Win 5 prediction challenges.',
    check: async (userId) => (await PredictionChallenge.countDocuments({ userId, result: 'win' })) >= 5,
  },
  {
    code: 'WALLET_MILESTONE',
    title: 'Doubled Up',
    description: `Grow your cash balance to 2x the starting ৳${STARTING_BALANCE_BDT.toLocaleString()}.`,
    check: async (userId) => {
      const wallet = await Wallet.findOne({ userId });
      return (wallet?.cashBalanceBDT ?? 0) >= STARTING_BALANCE_BDT * 2;
    },
  },
];

/**
 * Evaluate all not-yet-unlocked achievement rules for a user and persist
 * any newly satisfied ones. Called after trade/prediction/wallet events —
 * failures here must never break the action that triggered them.
 */
export async function evaluateAchievements(userId) {
  const unlockedCodes = new Set((await Achievement.find({ userId }).select('code')).map((a) => a.code));

  const newlyUnlockedCodes = [];
  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    if (unlockedCodes.has(definition.code)) continue;
    if (await definition.check(userId)) {
      newlyUnlockedCodes.push(definition.code);
    }
  }

  if (newlyUnlockedCodes.length === 0) return [];

  const created = await Promise.all(
    newlyUnlockedCodes.map((code) =>
      Achievement.create({ userId, code }).catch(() => null) // ignore race-condition duplicate unlocks
    )
  );

  return created.filter(Boolean);
}
