import { httpClient } from './httpClient';

/**
 * Stake virtual points on a price direction prediction.
 * Returns { prediction, wallet }.
 */
export const placePrediction = async ({ symbol, direction, pointsStaked, durationMinutes }) => {
  return httpClient.post('/api/predictions', { symbol, direction, pointsStaked, durationMinutes });
};

/**
 * Fetch paginated prediction history.
 * Returns { predictions, page, limit, total, totalPages }.
 */
export const getPredictionHistory = async ({ page = 1, limit = 20 } = {}) => {
  return httpClient.get('/api/predictions/history', { params: { page, limit } });
};
