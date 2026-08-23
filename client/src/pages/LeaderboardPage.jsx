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

function returnColor(value) {
  if (!value || value === 0) return 'var(--color-body)';
  return value > 0 ? 'var(--color-up)' : 'var(--color-down)';
}

function RankDisplay({ rank }) {
  if (rank === 1) return (
    <span style={{ fontWeight: 700, color: '#f0b90b', fontFamily: 'var(--font-mono)', fontSize: 16 }}>#1</span>
  );
  if (rank === 2) return (
    <span style={{ fontWeight: 700, color: '#929aa5', fontFamily: 'var(--font-mono)', fontSize: 16 }}>#2</span>
  );
  if (rank === 3) return (
    <span style={{ fontWeight: 700, color: '#cd7f32', fontFamily: 'var(--font-mono)', fontSize: 16 }}>#3</span>
  );
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-muted)', fontSize: 14 }}>
      #{rank}
    </span>
  );
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

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  // Find user's entry
  const myEntry = leaderboard.find((e) => e.userId === user?.id);

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
        <button onClick={loadLeaderboard} className="btn btn-secondary btn-sm">Try again</button>
      </div>
    );
  }

  return (
    <div className="page-stack">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-subtitle">Ranked by portfolio return % — fair across all simulated price paths.</p>
        </div>
        <button onClick={loadLeaderboard} className="btn btn-secondary btn-sm" id="leaderboard-refresh-btn">
          ↻ Refresh
        </button>
      </div>

      {/* ─── My Rank Banner (if found) ─── */}
      {myEntry && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            backgroundColor: 'rgba(252,213,53,0.08)',
            border: '1px solid rgba(252,213,53,0.3)',
            borderRadius: 'var(--radius-xl)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <RankDisplay rank={myEntry.rank} />
            <div>
              <p style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: 15, margin: 0 }}>
                {myEntry.name} <span style={{ color: 'var(--color-primary)', fontSize: 13 }}>(You)</span>
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '2px 0 0' }}>
                Account value: <span style={{ fontFamily: 'var(--font-mono)' }}>{formatBDT(myEntry.totalAccountValueBDT)}</span>
              </p>
            </div>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 24,
              fontWeight: 700,
              color: returnColor(myEntry.returnPercent),
              margin: 0,
            }}
          >
            {formatSignedPercent(myEntry.returnPercent)}
          </p>
        </div>
      )}

      {/* ─── Leaderboard Table ─── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {leaderboard.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p className="text-muted" style={{ fontSize: 15 }}>No traders on the board yet.</p>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Be the first to make a trade.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="cs-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Rank</th>
                  <th>Trader</th>
                  <th className="text-right">Account Value</th>
                  <th className="text-right">Return %</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => {
                  const isMe = entry.userId === user?.id;
                  return (
                    <tr
                      key={entry.userId}
                      id={`leaderboard-row-${entry.rank}`}
                      className={isMe ? 'table-row-highlight' : ''}
                    >
                      <td>
                        <RankDisplay rank={entry.rank} />
                      </td>
                      <td>
                        <span style={{ fontWeight: isMe ? 700 : 500, color: 'var(--color-ink)', fontSize: 14 }}>
                          {entry.name}
                        </span>
                        {isMe && (
                          <span
                            className="badge badge-yellow"
                            style={{ marginLeft: 8, fontSize: 11 }}
                          >
                            You
                          </span>
                        )}
                      </td>
                      <td className="text-right num" style={{ color: 'var(--color-body)' }}>
                        {formatBDT(entry.totalAccountValueBDT)}
                      </td>
                      <td
                        className="text-right num"
                        style={{
                          color: returnColor(entry.returnPercent),
                          fontWeight: 700,
                          fontSize: 15,
                        }}
                      >
                        {formatSignedPercent(entry.returnPercent)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
