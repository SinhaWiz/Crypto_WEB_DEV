import { Achievement } from '../models/Achievement.js';
import { ACHIEVEMENT_DEFINITIONS } from '../services/achievementService.js';

export async function getAchievements(req, res) {
  const unlocked = await Achievement.find({ userId: req.user.id });
  const unlockedMap = new Map(unlocked.map((a) => [a.code, a.unlockedAt]));

  const achievements = ACHIEVEMENT_DEFINITIONS.map((definition) => ({
    code: definition.code,
    title: definition.title,
    description: definition.description,
    unlocked: unlockedMap.has(definition.code),
    unlockedAt: unlockedMap.get(definition.code) ?? null,
  }));

  res.json({ achievements });
}
