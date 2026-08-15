import { httpClient } from './httpClient';

/**
 * Fetch the leaderboard: users ranked by portfolio return % relative to
 * their own starting balance. Returns an array of
 * { rank, userId, name, totalAccountValueBDT, returnPercent }.
 */
export const getLeaderboard = async () => {
  const response = await httpClient.get('/api/leaderboard');
  return response.leaderboard;
};
