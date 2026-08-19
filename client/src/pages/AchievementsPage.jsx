import { useEffect, useState, useCallback } from 'react';
import { getAchievements } from '../services/achievementService';

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

const ACHIEVEMENT_ICONS = {
  FIRST_TRADE: '⚡',
  FIVE_TRADES: '🔄',
  FIRST_PREDICTION: '🎯',
  PREDICTION_WINNER: '✅',
  FIVE_WINS: '🔮',
  WALLET_MILESTONE: '💰',
  WINNING_STREAK: '🔥',
};

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

  useEffect(() => { loadAchievements(); }, [loadAchievements]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
        <span className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="msg-error" style={{ marginBottom: 12 }}>{error}</div>
        <button onClick={loadAchievements} className="btn btn-secondary btn-sm">Try again</button>
      </div>
    );
  }

  return (
    <div className="page-stack">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Achievements</h1>
          <p className="page-subtitle">
            {unlockedCount} of {achievements.length} unlocked
          </p>
        </div>
        {/* Progress bar */}
        <div style={{ minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Progress</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-ink)' }}>
              {achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0}%
            </span>
          </div>
          <div
            style={{
              height: 6,
              backgroundColor: 'var(--color-surface)',
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid var(--color-hairline)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%`,
                backgroundColor: 'var(--color-primary)',
                borderRadius: 3,
                transition: 'width 600ms ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── Achievement Cards Grid ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {achievements.map((achievement) => {
          const icon = ACHIEVEMENT_ICONS[achievement.code] ?? '🏅';
          const unlocked = achievement.unlocked;
          const dateStr = formatDate(achievement.unlockedAt);

          return (
            <div
              key={achievement.code}
              id={`achievement-${achievement.code}`}
              className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}
            >
              {/* Icon + status */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    backgroundColor: unlocked
                      ? 'rgba(252,213,53,0.12)'
                      : 'var(--color-surface)',
                    border: `1px solid ${unlocked ? 'rgba(252,213,53,0.3)' : 'var(--color-hairline)'}`,
                    filter: unlocked ? 'none' : 'grayscale(1)',
                  }}
                >
                  {unlocked ? icon : '🔒'}
                </div>

                {unlocked && (
                  <div
                    style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'rgba(14,203,129,0.1)',
                      border: '1px solid rgba(14,203,129,0.3)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--color-up)',
                    }}
                  >
                    ✓ Unlocked
                  </div>
                )}
              </div>

              {/* Title + desc */}
              <div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: unlocked ? 'var(--color-ink)' : 'var(--color-muted)',
                    margin: '0 0 6px',
                  }}
                >
                  {achievement.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0, lineHeight: 1.5 }}>
                  {achievement.description}
                </p>
              </div>

              {/* Unlock date */}
              {dateStr && (
                <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>
                  Unlocked {dateStr}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
