import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { getLeaderboard } from '../services/leaderboardService';

function formatBDT(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `৳${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatSignedPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function returnColorClass(value) {
  if (value === null || value === undefined || value === 0) return 'text-gray-700';
  return value > 0 ? 'text-green-600' : 'text-red-600';
}

function rankBadge(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

export function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLeaderboard = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getLeaderboard()
      .then(setLeaderboard)
      .catch(() => setError('Could not load leaderboard'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

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
        <button onClick={loadLeaderboard} className="mt-4 text-purple-600 hover:underline text-sm">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
        <p className="text-gray-500 text-sm mt-1">
          Ranked by portfolio return % — fair no matter which simulated price path you walked.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {leaderboard.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">No traders on the board yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trader</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Account Value</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaderboard.map((entry) => (
                  <tr key={entry.userId} className={entry.userId === user?.id ? 'bg-purple-50' : undefined}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{rankBadge(entry.rank)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {entry.name}
                      {entry.userId === user?.id && (
                        <span className="ml-2 text-xs text-purple-600 font-semibold">(You)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">
                      {formatBDT(entry.totalAccountValueBDT)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${returnColorClass(entry.returnPercent)}`}>
                      {formatSignedPercent(entry.returnPercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
