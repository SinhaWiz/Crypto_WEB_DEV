import { STARTING_BALANCE_BDT } from '../constants/index.js';
import { User } from '../models/User.js';
import { getPortfolio } from './tradeService.js';

export async function getLeaderboard() {
  const users = await User.find({ status: 'active' }).sort({ createdAt: 1 }).limit(100);
  const entries = await Promise.all(
    users.map(async (user) => {
      try {
        const portfolio = await getPortfolio(user._id);
        const totalValueBDT = portfolio.totals.totalValueBDT;
        return {
          userId: user._id,
          name: user.name,
          totalValueBDT,
          returnPercent: ((totalValueBDT - STARTING_BALANCE_BDT) / STARTING_BALANCE_BDT) * 100,
        };
      } catch {
        return null;
      }
    })
  );

  return entries
    .filter(Boolean)
    .sort((a, b) => b.returnPercent - a.returnPercent)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
