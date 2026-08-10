import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAchievements } from '../services/gamificationService';

export function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getAchievements()
      .then(setAchievements)
      .catch(() => setError('Could not load achievements'));
  }, []);

  return (
    <div className="portfolio-page">
      <header className="dashboard-header">
        <h1>Achievements</h1>
        <Link to="/">Back to dashboard</Link>
      </header>
      {error && <p className="form-error">{error}</p>}
      <ul className="achievement-list">
        {achievements.map((achievement) => (
          <li key={achievement.code} className={achievement.unlocked ? 'unlocked' : ''}>
            <strong>{achievement.title}</strong>
            <span>{achievement.description}</span>
            <small>{achievement.unlocked ? 'Unlocked' : 'Locked'}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
