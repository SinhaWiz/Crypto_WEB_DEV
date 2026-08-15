import { LEARNING_CONTENT } from '../data/learningContent.js';

export function getLearningContent(req, res) {
  res.json({ lessons: LEARNING_CONTENT });
}
