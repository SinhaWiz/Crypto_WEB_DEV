import { Achievement } from '../models/Achievement.js';
import { Transaction } from '../models/Transaction.js';
import { PredictionChallenge } from '../models/PredictionChallenge.js';
import { Wallet } from '../models/Wallet.js';
import { User } from '../models/User.js';
import { STARTING_BALANCE_BDT } from '../constants/index.js';
import { PortfolioHolding } from '../models/PortfolioHolding.js';
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
  {
    code: 'WINNING_STREAK',
    title: 'Winning Streak',
    description: 'Make 5 consecutive profitable sell trades.',
    check: async (userId) => {
      const user = await User.findById(userId).select('winningStreakCount');
      return (user?.winningStreakCount ?? 0) >= 5;
    },
  },  {
    code: 'TEN_TRADES',
    title: 'Seasoned Trader',
    description: 'Execute 10 trades.',
    check: async (userId) => (await Transaction.countDocuments({ userId })) >= 10,
  },
  {
    code: 'TWENTY_TRADES',
    title: 'Market Veteran',
    description: 'Execute 20 trades.',
    check: async (userId) => (await Transaction.countDocuments({ userId })) >= 20,
  },
  {
    code: 'FIRST_SELL',
    title: 'Profit Taker',
    description: 'Complete your first sell order.',
    check: async (userId) => (await Transaction.countDocuments({ userId, side: 'sell' })) >= 1,
  },
  {
    code: 'DIVERSIFIED',
    title: 'Diversified Portfolio',
    description: 'Hold at least 3 different cryptocurrencies at the same time.',
    check: async (userId) => {
      const count = await PortfolioHolding.countDocuments({ userId, quantity: { $gt: 0 } });
      return count >= 3;
    },
  },
  {
    code: 'FULL_PORTFOLIO',
    title: 'Full Spectrum',
    description: 'Hold all 6 supported cryptocurrencies at the same time.',
    check: async (userId) => {
      const count = await PortfolioHolding.countDocuments({ userId, quantity: { $gt: 0 } });
      return count >= 6;
    },
  },
  {
    code: 'TEN_WINS',
    title: 'Prediction Master',
    description: 'Win 10 prediction challenges.',
    check: async (userId) => (await PredictionChallenge.countDocuments({ userId, result: 'win' })) >= 10,
  },
  {
    code: 'BIG_WINNER',
    title: 'High Roller',
    description: 'Win a single prediction with 50 or more points staked.',
    check: async (userId) =>
      (await PredictionChallenge.countDocuments({
        userId,
        result: 'win',
        pointsStaked: { $gte: 50 },
      })) >= 1,
  },
  {
    code: 'TRIPLE_UP',
    title: 'Triple Up',
    description: `Grow your cash balance to 3x the starting ৳${STARTING_BALANCE_BDT.toLocaleString()}.`,
    check: async (userId) => {
      const wallet = await Wallet.findOne({ userId });
      return (wallet?.cashBalanceBDT ?? 0) >= STARTING_BALANCE_BDT * 3;
    },
  },
  {
    code: 'POINTS_COLLECTOR',
    title: 'Points Collector',
    description: 'Reach 500 virtual points.',
    check: async (userId) => {
      const wallet = await Wallet.findOne({ userId });
      return (wallet?.virtualPoints ?? 0) >= 500;
    },
  },
  {
    code: 'STREAK_MASTER',
    title: 'Streak Master',
    description: 'Make 10 consecutive profitable sell trades.',
    check: async (userId) => {
      const user = await User.findById(userId).select('winningStreakCount');
      return (user?.winningStreakCount ?? 0) >= 10;
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
