import { useEffect, useState, useCallback } from 'react';
import { getAchievements } from '../services/achievementService';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAchievements = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getAchievements()
      .then(setAchievements)
      .catch(() => setError('Could not load achievements'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
        <button onClick={loadAchievements} className="mt-4 text-purple-600 hover:underline text-sm">
          Try again
        </button>
      </div>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
        <p className="text-gray-500 text-sm mt-1">
          {unlockedCount} of {achievements.length} unlocked
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.code}
            className={`rounded-xl border p-5 flex flex-col ${
              achievement.unlocked
                ? 'bg-white border-purple-200 shadow-sm'
                : 'bg-gray-50 border-gray-200 opacity-70'
            }`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-lg ${
                  achievement.unlocked ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-400'
                }`}
              >
                {achievement.unlocked ? '🏆' : '🔒'}
              </div>
              {achievement.unlocked && (
                <span className="text-xs text-gray-400">{formatDate(achievement.unlockedAt)}</span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mt-3">{achievement.title}</h3>
            <p className="text-xs text-gray-500 mt-1 flex-grow">{achievement.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
