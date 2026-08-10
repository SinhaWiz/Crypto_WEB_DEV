import { listAchievements } from '../services/achievementService.js';
import { getLeaderboard } from '../services/leaderboardService.js';

export async function showAchievements(req, res) {
  const achievements = await listAchievements(req.user.id);
  res.json({ achievements });
}

export async function showLeaderboard(req, res) {
  const leaderboard = await getLeaderboard();
  res.json({ leaderboard });
}
