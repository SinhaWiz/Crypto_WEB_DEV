import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeaderboard } from '../services/gamificationService';

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getLeaderboard()
      .then(setLeaderboard)
      .catch(() => setError('Could not load leaderboard'));
  }, []);

  return (
    <div className="portfolio-page">
      <header className="dashboard-header">
        <h1>Leaderboard</h1>
        <Link to="/">Back to dashboard</Link>
      </header>
      {error && <p className="form-error">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Total value</th>
              <th>Return</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr key={entry.userId}>
                <td>{entry.rank}</td>
                <td>{entry.name}</td>
                <td>{entry.totalValueBDT.toLocaleString(undefined, { maximumFractionDigits: 2 })} BDT</td>
                <td className={entry.returnPercent >= 0 ? 'positive' : 'negative'}>{entry.returnPercent.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
