import { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { useAuth } from '../features/auth/AuthContext';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/market', label: 'Market' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/wallet', label: 'Wallet' },
  { to: '/predictions', label: 'Predictions' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/achievements', label: 'Achievements' },
  { to: '/learning', label: 'Learning' },
];

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export function RootLayout() {
  const { user, wallet, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas)', transition: 'background-color 150ms ease' }}>
      <DisclaimerBanner />

      {/* ─── Top Navigation ─── */}
      <nav className="nav-root">
        <div className="nav-inner">
          {/* Logo */}
          <Link to="/" className="nav-logo" aria-label="CryptoSim home">
            <span className="nav-logo-icon">₿</span>
            <span>CryptoSim</span>
          </Link>

          {/* Desktop Nav Links */}
          {user && (
            <div className="nav-links">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`nav-link${isActive(to) ? ' active' : ''}`}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Right Actions */}
          <div className="nav-actions">
            {user ? (
              <>
                {/* Balance chip */}
                <div className="nav-balance-chip" title="Available cash balance">
                  <span className="label">Balance</span>
                  <span className="value">
                    {wallet?.cashBalanceBDT !== undefined
                      ? `৳${Math.floor(wallet.cashBalanceBDT).toLocaleString()}`
                      : '…'}
                  </span>
                </div>

                {/* User name */}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-ink)',
                    maxWidth: 100,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={user.name}
                >
                  {user.name}
                </span>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  id="nav-logout-btn"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm" id="nav-login-btn">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" id="nav-signup-btn">
                  Sign up
                </Link>
              </>
            )}

            {/* Mobile Hamburger */}
            <button
              className="hamburger"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle navigation menu"
              id="mobile-menu-btn"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Mobile Nav Drawer ─── */}
      {mobileOpen && (
        <div className="mobile-nav-drawer open" id="mobile-nav-drawer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span className="nav-logo" style={{ fontSize: 18 }}>CryptoSim</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="theme-toggle"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          </div>

          {user ? (
            <>
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`mobile-nav-link${isActive(to) ? ' active' : ''}`}
                >
                  {label}
                </Link>
              ))}
              <div className="divider" />
              {wallet && (
                <div style={{ padding: '8px 16px', fontSize: 13, color: 'var(--color-muted)' }}>
                  Balance:{' '}
                  <strong style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
                    ৳{Math.floor(wallet.cashBalanceBDT).toLocaleString()}
                  </strong>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ marginTop: 8, width: '100%' }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-nav-link">Log in</Link>
              <Link to="/register" className="btn btn-primary" style={{ textAlign: 'center', marginTop: 8 }}>
                Sign up free
              </Link>
            </>
          )}
        </div>
      )}

      {/* ─── Main Content ─── */}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
