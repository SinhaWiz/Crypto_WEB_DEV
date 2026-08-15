import { getLeaderboard } from '../services/leaderboardService.js';

export async function getLeaderboardEntries(req, res) {
  const entries = await getLeaderboard({ limit: 50 });
  res.json({ leaderboard: entries });
}
