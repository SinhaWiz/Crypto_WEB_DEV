import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { SUPPORTED_SYMBOLS } from '../lib/constants';
import { getCoin } from '../services/coinsService';
import { placePrediction, getPredictionHistory } from '../services/predictionService';

const DURATION_PRESETS = [
  { label: '15 sec', minutes: 0.25 },
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '1 hour', minutes: 60 },
  { label: '24 hours', minutes: 1440 },
];

function formatBDT(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `৳${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function ResultBadge({ result }) {
  if (result === 'win') return <span className="badge badge-up">WIN</span>;
  if (result === 'loss') return <span className="badge badge-down">LOSS</span>;
  return <span className="badge badge-pending">PENDING</span>;
}

export function PredictionsPage() {
  const { wallet, refreshWallet } = useAuth();
  const [symbol, setSymbol] = useState(SUPPORTED_SYMBOLS[0]);
  const [direction, setDirection] = useState('up');
  const [pointsStaked, setPointsStaked] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(DURATION_PRESETS[0].minutes);
  const [currentPriceBDT, setCurrentPriceBDT] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [historyPage, setHistoryPage] = useState(null);
  const [historyPageNumber, setHistoryPageNumber] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const loadHistory = useCallback(() => {
    setIsLoadingHistory(true);
    getPredictionHistory({ page: historyPageNumber, limit: 10 })
      .then(setHistoryPage)
      .catch(() => setHistoryPage(null))
      .finally(() => setIsLoadingHistory(false));
  }, [historyPageNumber]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    let cancelled = false;
    getCoin(symbol)
      .then((coin) => { if (!cancelled) setCurrentPriceBDT(coin.priceBDT); })
      .catch(() => { if (!cancelled) setCurrentPriceBDT(null); });
    return () => { cancelled = true; };
  }, [symbol]);

  const parsedPoints = Number(pointsStaked);
  const hasValidPoints = pointsStaked !== '' && Number.isFinite(parsedPoints) && parsedPoints > 0;
  const availablePoints = wallet?.virtualPoints ?? 0;
  const insufficientPoints = hasValidPoints && parsedPoints > availablePoints;
  const canSubmit = hasValidPoints && !insufficientPoints && !isSubmitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await placePrediction({ symbol, direction, pointsStaked: parsedPoints, durationMinutes });
      setSuccessMessage(
        `✓ Prediction placed: ${symbol} will go ${direction === 'up' ? '↑ UP' : '↓ DOWN'} within ${durationMinutes} min.`
      );
      setPointsStaked('');
      await refreshWallet();
      loadHistory();
    } catch (err) {
      setError(err?.message || 'Could not place prediction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      {/* Header */}
      <div>
        <h1 className="page-title">Predictions</h1>
        <p className="page-subtitle">
          Stake virtual points on where a coin's price is headed. Correct calls double your stake.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 20, alignItems: 'start' }}>
        {/* ─── Prediction Form ─── */}
        <div className="card card-p">
          <h2 className="section-title" style={{ marginBottom: 20, fontSize: 18 }}>Place a Prediction</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Coin + current price */}
            <div>
              <label htmlFor="prediction-symbol" className="cs-label">Coin</label>
              <select
                id="prediction-symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="cs-select"
              >
                {SUPPORTED_SYMBOLS.map((sym) => (
                  <option key={sym} value={sym}>{sym}</option>
                ))}
              </select>
              {currentPriceBDT && (
                <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 6 }}>
                  Current price:{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', fontWeight: 600 }}>
                    {formatBDT(currentPriceBDT)}
                  </span>
                </p>
              )}
            </div>

            {/* Direction */}
            <div>
              <span className="cs-label">Direction</span>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  padding: 4,
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-hairline)',
                }}
              >
                <button
                  type="button"
                  id="pred-dir-up"
                  onClick={() => setDirection('up')}
                  style={{
                    padding: '12px 0',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    backgroundColor: direction === 'up' ? 'var(--color-up)' : 'transparent',
                    color: direction === 'up' ? '#fff' : 'var(--color-muted)',
                  }}
                >
                  ▲ Up
                </button>
                <button
                  type="button"
                  id="pred-dir-down"
                  onClick={() => setDirection('down')}
                  style={{
                    padding: '12px 0',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    backgroundColor: direction === 'down' ? 'var(--color-down)' : 'transparent',
                    color: direction === 'down' ? '#fff' : 'var(--color-muted)',
                  }}
                >
                  ▼ Down
                </button>
              </div>
            </div>

            {/* Duration presets */}
            <div>
              <span className="cs-label">Closes in</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.minutes}
                    type="button"
                    id={`duration-${preset.minutes}`}
                    onClick={() => setDurationMinutes(preset.minutes)}
                    style={{
                      padding: '8px 0',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${durationMinutes === preset.minutes ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      backgroundColor: durationMinutes === preset.minutes ? 'rgba(252,213,53,0.12)' : 'var(--color-canvas)',
                      color: durationMinutes === preset.minutes ? 'var(--color-on-primary-text, #92700a)' : 'var(--color-body)',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Points to stake */}
            <div>
              <label htmlFor="prediction-points" className="cs-label">
                Points to stake
              </label>
              <input
                id="prediction-points"
                type="number"
                min="1"
                step="1"
                value={pointsStaked}
                onChange={(e) => { setPointsStaked(e.target.value); setError(null); setSuccessMessage(null); }}
                placeholder="0"
                className="cs-input"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 16 }}
              />
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 6 }}>
                Available:{' '}
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-ink)' }}>
                  {availablePoints} pts
                </span>
                {hasValidPoints && !insufficientPoints && (
                  <span style={{ marginLeft: 8, color: 'var(--color-up)' }}>
                    → Win: {parsedPoints * 2} pts
                  </span>
                )}
              </p>
            </div>

            {insufficientPoints && (
              <p className="msg-error">You don't have enough points for this stake.</p>
            )}
            {error && <p className="msg-error">{error}</p>}
            {successMessage && <p className="msg-success">{successMessage}</p>}

            <button
              type="submit"
              id="place-prediction-btn"
              disabled={!canSubmit}
              className="btn btn-primary btn-full"
            >
              {isSubmitting ? 'Placing…' : 'Place Prediction'}
            </button>
          </form>
        </div>

        {/* ─── Info Card ─── */}
        <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 className="section-title">How it works</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { step: '1', text: 'Pick a coin, direction (up/down), duration, and points to stake.' },
              { step: '2', text: 'Your prediction is judged against your own simulated price feed at the close time.' },
              { step: '3', text: 'Win: get double your stake back. Lose: forfeit the stake.' },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {step}
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0, lineHeight: 1.5 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Prediction History ─── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)' }}>
          <p className="section-title">Your Predictions</p>
        </div>

        {isLoadingHistory ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <span className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : !historyPage || historyPage.predictions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p className="text-muted" style={{ fontSize: 14 }}>No predictions yet.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="cs-table">
                <thead>
                  <tr>
                    <th>Coin</th>
                    <th>Direction</th>
                    <th className="text-right">Staked</th>
                    <th className="text-right">Start Price</th>
                    <th className="text-right">End Price</th>
                    <th>Closes</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {historyPage.predictions.map((prediction) => (
                    <tr key={prediction._id}>
                      <td className="font-medium">{prediction.symbol}</td>
                      <td>
                        <span
                          className={prediction.direction === 'up' ? 'text-up' : 'text-down'}
                          style={{ fontWeight: 600 }}
                        >
                          {prediction.direction === 'up' ? '▲ Up' : '▼ Down'}
                        </span>
                      </td>
                      <td className="text-right num">{prediction.pointsStaked} pts</td>
                      <td className="text-right num">{formatBDT(prediction.startPriceBDT)}</td>
                      <td className="text-right num">{formatBDT(prediction.endPriceBDT)}</td>
                      <td style={{ fontSize: 12, color: 'var(--color-muted)' }}>{formatDate(prediction.closesAt)}</td>
                      <td><ResultBadge result={prediction.result} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span className="pagination-info">
                Page {historyPage.page} of {historyPage.totalPages}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setHistoryPageNumber((p) => Math.max(1, p - 1))}
                  disabled={historyPage.page <= 1}
                  className="btn btn-secondary btn-sm"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryPageNumber((p) => Math.min(historyPage.totalPages, p + 1))}
                  disabled={historyPage.page >= historyPage.totalPages}
                  className="btn btn-secondary btn-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
