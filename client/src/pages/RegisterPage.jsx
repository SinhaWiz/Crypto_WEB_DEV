import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner', desc: 'Low volatility, gentle price swings' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Moderate volatility, realistic market feel' },
  { value: 'expert', label: 'Expert', desc: 'High volatility, near real-market intensity' },
];

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await register({ name, email, password, difficulty });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
          maxWidth: 460,
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
          <h1 className="page-title" style={{ fontSize: 28 }}>Create an account</h1>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', marginTop: 6 }}>
            Already have one?{' '}
            <Link
              to="/login"
              style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Error */}
        {error && <div className="msg-error" style={{ marginBottom: 20 }}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="reg-name" className="cs-label">Full Name</label>
            <input
              id="reg-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="cs-input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="cs-label">Email address</label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password" className="cs-label">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="cs-input"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Difficulty Selector */}
          <div>
            <label className="cs-label">Market Difficulty</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DIFFICULTIES.map(({ value, label, desc }) => (
                <label
                  key={value}
                  htmlFor={`diff-${value}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${difficulty === value ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                    backgroundColor: difficulty === value ? 'rgba(252,213,53,0.06)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  <input
                    id={`diff-${value}`}
                    type="radio"
                    name="difficulty"
                    value={value}
                    checked={difficulty === value}
                    onChange={() => setDifficulty(value)}
                    style={{ accentColor: 'var(--color-primary)', width: 16, height: 16, flexShrink: 0 }}
                  />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            id="register-submit-btn"
            disabled={isSubmitting}
            className="btn btn-primary btn-full"
            style={{ marginTop: 8 }}
          >
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                Creating account…
              </span>
            ) : (
              'Create Account — It\'s Free'
            )}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--color-muted)',
            marginTop: 24,
            lineHeight: 1.5,
          }}
        >
          By registering you agree this is an educational simulator. No real funds are involved.
        </p>
      </div>
    </div>
  );
}
