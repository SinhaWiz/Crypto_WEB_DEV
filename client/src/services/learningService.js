import { httpClient } from './httpClient';

/**
 * Fetch the static learning content.
 * Returns an array of { slug, title, category, summary, body }.
 */
export const getLearningContent = async () => {
  const response = await httpClient.get('/api/learning');
  return response.lessons;
};
