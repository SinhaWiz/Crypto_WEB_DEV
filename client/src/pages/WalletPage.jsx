import { useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { POINTS_EXCHANGE_RATE_BDT, TRADE_FEE_RATE } from '../lib/constants';
import { buyPoints } from '../services/walletService';

function formatBDT(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `৳${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function WalletPage() {
  const { wallet, refreshWallet } = useAuth();
  const [pointsToBuy, setPointsToBuy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const parsedPoints = Number(pointsToBuy);
  const hasValidPoints = pointsToBuy !== '' && Number.isFinite(parsedPoints) && parsedPoints > 0;
  const costBDT = hasValidPoints ? parsedPoints * POINTS_EXCHANGE_RATE_BDT : 0;
  const availableCashBDT = wallet?.cashBalanceBDT ?? 0;
  const insufficientCash = hasValidPoints && costBDT > availableCashBDT;
  const canSubmit = hasValidPoints && !insufficientCash && !isSubmitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await buyPoints({ pointsToBuy: parsedPoints });
      setSuccessMessage(`Purchased ${parsedPoints} point(s) for ${formatBDT(costBDT)}.`);
      setPointsToBuy('');
      await refreshWallet();
    } catch (err) {
      setError(err?.message || 'Could not buy points. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      {/* Header */}
      <div>
        <h1 className="page-title">Wallet</h1>
        <p className="page-subtitle">Manage your cash balance and virtual points.</p>
      </div>

      {/* ─── Balance Overview ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="stat-card">
          <p className="stat-label">Cash Balance</p>
          <p className="stat-value-yellow" style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700 }}>
            {formatBDT(availableCashBDT)}
          </p>
          <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>Available for trading & points</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Virtual Points</p>
          <p className="stat-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700 }}>
            {wallet?.virtualPoints ?? 0}
          </p>
          <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>Use to stake predictions</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 20, alignItems: 'start' }}>
        {/* ─── Buy Points Form ─── */}
        <div className="card card-p">
          <h2 className="section-title" style={{ marginBottom: 20, fontSize: 18 }}>Buy Virtual Points</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label htmlFor="points-to-buy" className="cs-label">
                Points to buy
              </label>
              <input
                id="points-to-buy"
                type="number"
                min="1"
                step="1"
                value={pointsToBuy}
                onChange={(e) => { setPointsToBuy(e.target.value); setError(null); setSuccessMessage(null); }}
                placeholder="e.g. 10"
                className="cs-input"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 16 }}
              />
              <p className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>
                Rate: 1 point = {formatBDT(POINTS_EXCHANGE_RATE_BDT)} cash
              </p>
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <div className="order-row">
                <span className="label">Points</span>
                <span className="value">{hasValidPoints ? parsedPoints : '—'}</span>
              </div>
              <div className="order-row">
                <span className="label">Cost</span>
                <span className="value">{hasValidPoints ? formatBDT(costBDT) : '—'}</span>
              </div>
              <div className="order-row" style={{ paddingTop: 8, marginTop: 6, borderTop: '1px solid var(--color-hairline)' }}>
                <span className="label" style={{ fontWeight: 600, color: 'var(--color-body)' }}>Available cash</span>
                <span className="value" style={{ color: insufficientCash ? 'var(--color-down)' : 'var(--color-ink)' }}>
                  {formatBDT(availableCashBDT)}
                </span>
              </div>
            </div>

            {insufficientCash && (
              <p className="msg-error">Insufficient cash balance for this purchase.</p>
            )}
            {error && <p className="msg-error">{error}</p>}
            {successMessage && <p className="msg-success">{successMessage}</p>}

            <button
              type="submit"
              id="buy-points-btn"
              disabled={!canSubmit}
              className="btn btn-primary btn-full"
            >
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Buying…
                </span>
              ) : (
                'Buy Points'
              )}
            </button>
          </form>
        </div>

        {/* ─── Info Card ─── */}
        <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h3 className="section-title" style={{ marginBottom: 12 }}>How it works</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Points are used to stake predictions on price direction.',
                'Win a prediction and get double your stake back.',
                `1 point costs ${formatBDT(POINTS_EXCHANGE_RATE_BDT)} of your cash balance.`,
                `Buying and selling coins carries a ${(TRADE_FEE_RATE * 100).toFixed(1)}% platform fee.`,
              ].map((text) => (
                <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--color-primary)', flexShrink: 0, lineHeight: '1.5' }}>&bull;</span>
                  <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0, lineHeight: 1.5 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'rgba(252,213,53,0.07)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(252,213,53,0.25)',
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
              All balances are virtual and for educational purposes only. No real money is involved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
