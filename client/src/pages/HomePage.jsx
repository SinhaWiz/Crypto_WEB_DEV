import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

const FEATURES = [
  {
    title: 'Virtual Balance',
    desc: 'Start with ৳1,00,000 virtual BDT and trade against real-time simulated ticks.',
  },
  {
    title: 'Live Market Engine',
    desc: 'Unique price ticks per user, anchored to real CoinGecko prices.',
  },
  {
    title: 'Gamification',
    desc: 'Leaderboard, achievements, and price-direction predictions.',
  },
  {
    title: '100% Educational',
    desc: 'No real money, no risk — just market mechanics.',
  },
];

const STATS = [
  { value: '6', label: 'Crypto Assets' },
  { value: '৳1L', label: 'Starting Balance' },
  { value: '3s', label: 'Price Tick Speed' },
  { value: '7', label: 'Achievements' },
];

export function HomePage() {
  const { user } = useAuth();

  return (
    <div style={{ margin: '0 -24px' }}>

      {/* ─── Hero Band ─── */}
      <section
        style={{
          backgroundColor: '#000000',
          color: '#ffffff',
          padding: '80px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Eyebrow */}
          <div
            className="badge badge-yellow"
            style={{ display: 'inline-flex', marginBottom: 24, fontSize: 13 }}
          >
            Made for Bangladesh — 100% Educational
          </div>

          {/* H1 */}
          <h1
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-1.5px',
              color: '#ffffff',
              margin: '0 0 12px',
            }}
          >
            Learn Crypto Trading{' '}
            <span style={{ color: 'var(--color-primary)' }}>Without the Risk</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 18,
              color: '#929aa5',
              lineHeight: 1.6,
              maxWidth: 560,
              margin: '0 auto 40px',
            }}
          >
            Practice trading, read market volatility, and manage a portfolio — with zero real risk.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-primary-pill" id="home-dashboard-btn">
                  Go to Dashboard →
                </Link>
                <Link to="/market" className="btn btn-ghost" style={{ color: '#929aa5', fontSize: 15 }}>
                  View Live Markets
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary-pill" id="home-signup-btn">
                  Start Trading for Free →
                </Link>
                <Link to="/login" className="btn btn-ghost" style={{ color: '#929aa5', fontSize: 15 }}>
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── Stats Band ─── */}
      <section
        style={{
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-hairline)',
          borderBottom: '1px solid var(--color-hairline)',
          padding: '32px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 24,
          }}
        >
          {STATS.map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p
                className="stat-value-yellow"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 32,
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {value}
              </p>
              <p className="text-muted" style={{ fontSize: 13 }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section style={{ padding: '80px 24px', backgroundColor: 'var(--color-canvas)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p className="section-label" style={{ color: 'var(--color-primary)', marginBottom: 12 }}>
              Master the Market
            </p>
            <h2 className="page-title" style={{ fontSize: 36 }}>
              Everything you need to practice trading
            </h2>
          </div>

          {/* Feature cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 24,
            }}
          >
            {FEATURES.map(({ title, desc }, i) => (
              <div key={title} className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'rgba(252, 213, 53, 0.12)',
                    border: '1px solid rgba(252, 213, 53, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 8 }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Band ─── */}
      {!user && (
        <section
          style={{
            backgroundColor: 'var(--color-surface)',
            borderTop: '1px solid var(--color-hairline)',
            padding: '60px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 className="page-title" style={{ fontSize: 32, marginBottom: 16 }}>
              Ready to start trading?
            </h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: 32, lineHeight: 1.6 }}>
              Free account, ৳1,00,000 virtual balance, no card required.
            </p>
            <Link to="/register" className="btn btn-primary-pill" id="home-cta-signup-btn">
              Create Free Account
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
