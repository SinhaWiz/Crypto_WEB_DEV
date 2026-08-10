import { learningLessons } from '../services/learningContent.js';

export function listLearningContent(req, res) {
  res.json({ lessons: learningLessons });
}
