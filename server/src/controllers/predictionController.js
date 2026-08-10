import { createPrediction, listPredictionHistory } from '../services/predictionService.js';

export async function createPredictionChallenge(req, res) {
  const prediction = await createPrediction(req.user.id, req.body);
  res.status(201).json({ prediction });
}

export async function showPredictionHistory(req, res) {
  const predictions = await listPredictionHistory(req.user.id);
  res.json({ predictions });
}
