import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { STARTING_BALANCE_BDT } from '../lib/constants';
import { getPortfolio } from '../services/tradeService';
import { getAchievements } from '../services/achievementService';

function formatBDT(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `৳${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompact(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (Math.abs(value) >= 1000) {
    return `৳${(value / 1000).toFixed(1)}k`;
  }
  return formatBDT(value);
}

const QUICK_LINKS = [
  { to: '/market', label: 'View Market', desc: 'Browse live prices' },
  { to: '/portfolio', label: 'Portfolio', desc: 'Your holdings & P/L' },
  { to: '/predictions', label: 'Predictions', desc: 'Stake virtual points' },
  { to: '/achievements', label: 'Achievements', desc: 'Your milestones' },
  { to: '/leaderboard', label: 'Leaderboard', desc: 'Compare with others' },
  { to: '/learning', label: 'Learning', desc: 'Crypto basics' },
];

export function DashboardPage() {
  const { user, wallet } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    getPortfolio()
      .then(setPortfolio)
      .catch(() => setPortfolio(null));
    getAchievements()
      .then(setAchievements)
      .catch(() => setAchievements([]));
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalValue =
    (wallet?.cashBalanceBDT ?? 0) + (portfolio?.totalValueBDT ?? 0);
  const returnPct =
    STARTING_BALANCE_BDT > 0
      ? ((totalValue - STARTING_BALANCE_BDT) / STARTING_BALANCE_BDT) * 100
      : 0;
  const pnlPositive = (portfolio?.totalUnrealizedPnlBDT ?? 0) >= 0;
  const returnPositive = returnPct >= 0;

  return (
    <div className="page-stack">
      {/* ─── Welcome Banner ─── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #2b2410 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
        }}
      >
        <div>
          <p style={{ fontSize: 13, color: '#929aa5', marginBottom: 6 }}>Welcome back</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>
            {user?.name}
          </h1>
          <p style={{ color: '#707a8a', fontSize: 14, marginTop: 8, maxWidth: 400 }}>
            Practice trading and learn crypto market mechanics — completely risk-free.
          </p>
        </div>
        <Link to="/market" className="btn btn-primary" style={{ flexShrink: 0 }}>
          Go to Market →
        </Link>
      </div>

      {/* ─── Stat Cards ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        {/* Cash Balance */}
        <div className="stat-card">
          <p className="stat-label">Available Cash</p>
          <p className="stat-value-yellow" style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700 }}>
            {wallet?.cashBalanceBDT !== undefined
              ? formatBDT(wallet.cashBalanceBDT)
              : '…'}
          </p>
          <p className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>
            Started with {formatBDT(STARTING_BALANCE_BDT)}
          </p>
        </div>

        {/* Portfolio Value */}
        <div className="stat-card">
          <p className="stat-label">Portfolio Value</p>
          <p className="stat-value" style={{ fontSize: 26 }}>
            {formatBDT(portfolio?.totalValueBDT ?? 0)}
          </p>
          {portfolio?.totalUnrealizedPnlBDT !== undefined && (
            <p
              className={pnlPositive ? 'text-up' : 'text-down'}
              style={{ fontSize: 12, marginTop: 6, fontFamily: 'var(--font-mono)' }}
            >
              {pnlPositive ? '+' : ''}
              {formatBDT(portfolio.totalUnrealizedPnlBDT)} unrealized
            </p>
          )}
        </div>

        {/* Total Account Return */}
        <div className="stat-card">
          <p className="stat-label">Total Return</p>
          <p
            className={returnPositive ? 'text-up' : 'text-down'}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700 }}
          >
            {returnPositive ? '+' : ''}{returnPct.toFixed(2)}%
          </p>
          <p className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>
            Account value: {formatBDT(totalValue)}
          </p>
        </div>

        {/* Virtual Points */}
        <div className="stat-card">
          <p className="stat-label">Virtual Points</p>
          <p className="stat-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 26 }}>
            {wallet?.virtualPoints ?? 0}
          </p>
          <p className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>
            {unlockedCount}/{achievements.length || '—'} achievements
          </p>
        </div>
      </div>

      {/* ─── Quick Links Grid ─── */}
      <div>
        <h2 className="section-title" style={{ marginBottom: 14 }}>Quick Navigation</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
          }}
        >
          {QUICK_LINKS.map(({ to, label, desc }) => (
            <Link
              key={to}
              to={to}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card card-p-sm"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transition: 'all 150ms ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(252,213,53,0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-elevated)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-hairline)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
                  {label}
                </p>
                <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
