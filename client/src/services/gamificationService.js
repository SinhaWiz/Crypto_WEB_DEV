import { httpClient } from './httpClient';

export async function createPrediction(input) {
  const { data } = await httpClient.post('/predictions', input);
  return data.prediction;
}

export async function getPredictionHistory() {
  const { data } = await httpClient.get('/predictions/history');
  return data.predictions;
}

export async function getAchievements() {
  const { data } = await httpClient.get('/achievements');
  return data.achievements;
}

export async function getLeaderboard() {
  const { data } = await httpClient.get('/leaderboard');
  return data.leaderboard;
}

export async function getLearningLessons() {
  const { data } = await httpClient.get('/learning');
  return data.lessons;
}
