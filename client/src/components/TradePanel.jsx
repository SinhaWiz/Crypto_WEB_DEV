import { useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { TRADE_FEE_RATE } from '../lib/constants';
import { buyCoin, sellCoin } from '../services/tradeService';

function formatBDT(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `৳${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Buy/sell trade form for a single coin. Executes market orders against
 * the live simulated price and reports the wallet/holding update upward
 * so the parent page can refresh its own data.
 */
export function TradePanel({ symbol, priceBDT, holdingQuantity = 0, onTradeComplete }) {
  const { wallet, refreshWallet } = useAuth();
  const [side, setSide] = useState('buy');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const parsedQuantity = Number(quantity);
  const hasValidQuantity = quantity !== '' && Number.isFinite(parsedQuantity) && parsedQuantity > 0;
  const estimatedSubtotalBDT = hasValidQuantity && priceBDT ? parsedQuantity * priceBDT : 0;
  const estimatedFeeBDT = estimatedSubtotalBDT * TRADE_FEE_RATE;
  const estimatedTotalBDT =
    side === 'buy' ? estimatedSubtotalBDT + estimatedFeeBDT : estimatedSubtotalBDT - estimatedFeeBDT;

  const cashBalanceBDT = wallet?.cashBalanceBDT ?? 0;
  const insufficientBalance = side === 'buy' && hasValidQuantity && estimatedTotalBDT > cashBalanceBDT;
  const insufficientHoldings = side === 'sell' && hasValidQuantity && parsedQuantity > holdingQuantity;
  const canSubmit = hasValidQuantity && !insufficientBalance && !insufficientHoldings && !isSubmitting && priceBDT;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const action = side === 'buy' ? buyCoin : sellCoin;
      const result = await action({ symbol, quantity: parsedQuantity });

      setSuccessMessage(
        `${side === 'buy' ? 'Bought' : 'Sold'} ${parsedQuantity} ${symbol} at ${formatBDT(priceBDT)}`
      );
      setQuantity('');
      await refreshWallet();
      onTradeComplete?.(result);
    } catch (err) {
      setError(err?.message || 'Trade failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="card card-p"
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* Header */}
      <div>
        <p className="section-label">Trade</p>
        <h3
          className="section-title"
          style={{ fontSize: 18, marginTop: 4 }}
        >
          {symbol}
        </h3>
      </div>

      {/* Buy / Sell Tab Toggle */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          padding: 4,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-hairline)',
        }}
      >
        <button
          type="button"
          id="trade-buy-tab"
          onClick={() => { setSide('buy'); setError(null); setSuccessMessage(null); }}
          style={{
            padding: '8px 0',
            borderRadius: 6,
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 150ms ease',
            backgroundColor: side === 'buy' ? 'var(--color-up)' : 'transparent',
            color: side === 'buy' ? '#fff' : 'var(--color-muted)',
          }}
        >
          ↑ Buy
        </button>
        <button
          type="button"
          id="trade-sell-tab"
          onClick={() => { setSide('sell'); setError(null); setSuccessMessage(null); }}
          style={{
            padding: '8px 0',
            borderRadius: 6,
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 150ms ease',
            backgroundColor: side === 'sell' ? 'var(--color-down)' : 'transparent',
            color: side === 'sell' ? '#fff' : 'var(--color-muted)',
          }}
        >
          ↓ Sell
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Quantity Input */}
        <div>
          <label htmlFor="trade-quantity" className="cs-label">
            Quantity ({symbol})
          </label>
          <input
            id="trade-quantity"
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00000"
            className="cs-input"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 15 }}
          />
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <div className="order-row">
            <span className="label">Live price</span>
            <span className="value">{formatBDT(priceBDT)}</span>
          </div>
          <div className="order-row">
            <span className="label">Subtotal</span>
            <span className="value">{formatBDT(estimatedSubtotalBDT || 0)}</span>
          </div>
          <div className="order-row">
            <span className="label">Fee ({(TRADE_FEE_RATE * 100).toFixed(1)}%)</span>
            <span className="value">
              {side === 'buy' ? '+' : '−'}{formatBDT(estimatedFeeBDT || 0)}
            </span>
          </div>
          <div
            className="order-row"
            style={{
              paddingTop: 8,
              marginTop: 6,
              borderTop: '1px solid var(--color-hairline)',
            }}
          >
            <span className="label" style={{ fontWeight: 600, color: 'var(--color-body)' }}>
              {side === 'buy' ? 'Total cost' : 'Net proceeds'}
            </span>
            <span className="value" style={{ fontSize: 15, color: 'var(--color-ink)' }}>
              {formatBDT(estimatedTotalBDT || 0)}
            </span>
          </div>

          <div className="divider" style={{ margin: '8px 0' }} />

          {side === 'buy' && (
            <div className="order-row">
              <span className="label">Available cash</span>
              <span className="value">{formatBDT(cashBalanceBDT)}</span>
            </div>
          )}
          {side === 'sell' && (
            <div className="order-row">
              <span className="label">Holdings</span>
              <span className="value" style={{ fontFamily: 'var(--font-mono)' }}>
                {holdingQuantity} {symbol}
              </span>
            </div>
          )}
        </div>

        {/* Messages */}
        {(insufficientBalance || insufficientHoldings) && (
          <p className="msg-error">
            {insufficientBalance
              ? 'Insufficient balance for this trade.'
              : `You don't hold enough ${symbol} for this trade.`}
          </p>
        )}
        {error && <p className="msg-error">{error}</p>}
        {successMessage && <p className="msg-success">{successMessage}</p>}

        {/* Submit Button */}
        <button
          type="submit"
          id="trade-submit-btn"
          disabled={!canSubmit}
          className={`btn btn-full${side === 'buy' ? ' btn-buy' : ' btn-sell'}`}
          style={{ fontSize: 15, fontWeight: 700 }}
        >
          {isSubmitting
            ? 'Placing order…'
            : side === 'buy'
            ? `Buy ${symbol}`
            : `Sell ${symbol}`}
        </button>
      </form>
    </div>
  );
}
