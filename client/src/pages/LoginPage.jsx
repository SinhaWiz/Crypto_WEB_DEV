import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '72vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: 'var(--color-surface-card)',
          border: '1px solid var(--color-hairline)',
          borderRadius: 'var(--radius-xl)',
          padding: 36,
          boxShadow: 'var(--shadow-elevated)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p className="section-label" style={{ marginBottom: 8 }}>CryptoSim</p>
          <h1 className="page-title" style={{ fontSize: 28 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', marginTop: 6 }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              Create one free
            </Link>
          </p>
        </div>

        {/* Error */}
        {error && <div className="msg-error" style={{ marginBottom: 20 }}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="login-email" className="cs-label">Email address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="cs-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="cs-label">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="cs-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={isSubmitting}
            className="btn btn-primary btn-full"
            style={{ marginTop: 8 }}
          >
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--color-muted)',
            marginTop: 24,
            lineHeight: 1.5,
          }}
        >
          Educational simulator only. No real funds involved.
        </p>
      </div>
    </div>
  );
}
