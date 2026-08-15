import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { getPortfolioSummary } from './portfolioService.js';
import { STARTING_BALANCE_BDT } from '../constants/index.js';

/**
 * Rank all users by portfolio return % relative to their own starting
 * balance. This stays fair even though every user walks their own
 * simulated price path — a doubled account is a doubled account,
 * regardless of the underlying prices that got it there.
 */
export async function getLeaderboard({ limit = 50 } = {}) {
  const users = await User.find({ status: 'active' }).select('_id name');
  const wallets = await Wallet.find({ userId: { $in: users.map((u) => u._id) } });
  const walletByUserId = new Map(wallets.map((wallet) => [wallet.userId.toString(), wallet]));

  const entries = await Promise.all(
    users.map(async (user) => {
      const wallet = walletByUserId.get(user._id.toString());
      const cashBalanceBDT = wallet?.cashBalanceBDT ?? 0;
      const { totalValueBDT: holdingsValueBDT } = await getPortfolioSummary(user._id);
      const totalAccountValueBDT = cashBalanceBDT + holdingsValueBDT;
      const returnPercent = ((totalAccountValueBDT - STARTING_BALANCE_BDT) / STARTING_BALANCE_BDT) * 100;

      return {
        userId: user._id,
        name: user.name,
        totalAccountValueBDT,
        returnPercent,
      };
    })
  );

  return entries
    .sort((a, b) => b.returnPercent - a.returnPercent)
    .slice(0, limit)
    .map((entry, index) => ({ rank: index + 1, ...entry }));
}
