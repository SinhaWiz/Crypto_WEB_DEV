import { httpClient } from './httpClient';

/**
 * Fetch all achievement definitions merged with the user's unlock status.
 * Returns an array of { code, title, description, unlocked, unlockedAt }.
 */
export const getAchievements = async () => {
  const response = await httpClient.get('/api/achievements');
  return response.achievements;
};
