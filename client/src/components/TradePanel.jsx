import { useCallback, useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { TRADE_FEE_RATE } from '../lib/constants';
import { buyCoin, sellCoin, openPosition, closePosition } from '../services/tradeService';
import { SlideButton } from './ui/slide-button';

function formatBDT(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `৳${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatQuantity(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 8,
  });
}

/**
 * Trade form for a single coin. Supports classic spot buy/sell and
 * leveraged long/short positions against the user's simulated price.
 */
export function TradePanel({ symbol, priceBDT, holdingQuantity = 0, positions = [], onTradeComplete }) {
  const { wallet, refreshWallet } = useAuth();
  const [tradeMode, setTradeMode] = useState('spot');
  const [spotSide, setSpotSide] = useState('buy');
  const [positionSide, setPositionSide] = useState('long');
  const [leverage, setLeverage] = useState(1);
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const parsedQuantity = Number(quantity);
  const hasValidQuantity = quantity !== '' && Number.isFinite(parsedQuantity) && parsedQuantity > 0;

  const activePosition = positions.find((position) => position.side === positionSide) ?? null;
  const isClosingPosition = tradeMode === 'position' && Boolean(activePosition);

  const spotSubtotalBDT = hasValidQuantity && priceBDT ? parsedQuantity * priceBDT : 0;
  const spotFeeBDT = spotSubtotalBDT * TRADE_FEE_RATE;
  const spotTotalBDT = spotSide === 'buy' ? spotSubtotalBDT + spotFeeBDT : spotSubtotalBDT - spotFeeBDT;

  const positionLeverage = isClosingPosition ? activePosition?.leverage ?? leverage : leverage;
  const positionBaseValueBDT = hasValidQuantity && priceBDT ? parsedQuantity * priceBDT : 0;
  const positionExposureBDT = positionBaseValueBDT * positionLeverage;
  const positionFeeBDT = positionExposureBDT * TRADE_FEE_RATE;
  const positionOpenDebitBDT = positionBaseValueBDT + positionFeeBDT;

  const closeableQuantity = activePosition?.quantity ?? 0;
  const closeQuantityShare =
    isClosingPosition && hasValidQuantity && closeableQuantity > 0 ? parsedQuantity / closeableQuantity : 0;
  const closeMarginBDT = isClosingPosition ? (activePosition?.marginBDT ?? 0) * closeQuantityShare : 0;
  const closeGrossPnlBDT =
    isClosingPosition && activePosition && hasValidQuantity
      ? (positionSide === 'long'
          ? (priceBDT - activePosition.entryPriceBDT)
          : (activePosition.entryPriceBDT - priceBDT)) *
        parsedQuantity *
        activePosition.leverage
      : 0;
  const closeEffectivePnlBDT = Math.max(closeGrossPnlBDT, -closeMarginBDT);
  const closeNetCreditBDT = closeMarginBDT + closeEffectivePnlBDT - positionFeeBDT;

  const insufficientBalance =
    tradeMode === 'spot'
      ? spotSide === 'buy' && hasValidQuantity && spotTotalBDT > (wallet?.cashBalanceBDT ?? 0)
      : !isClosingPosition && hasValidQuantity && positionOpenDebitBDT > (wallet?.cashBalanceBDT ?? 0);
  const insufficientHoldings = tradeMode === 'spot' && spotSide === 'sell' && hasValidQuantity && parsedQuantity > holdingQuantity;
  const insufficientPositionQuantity =
    tradeMode === 'position' && isClosingPosition && hasValidQuantity && parsedQuantity > closeableQuantity;
  const canSubmit =
    hasValidQuantity &&
    !insufficientBalance &&
    !insufficientHoldings &&
    !insufficientPositionQuantity &&
    !isSubmitting &&
    priceBDT;

  const modeActionLabel =
    tradeMode === 'spot'
      ? spotSide === 'buy'
        ? 'Buy'
        : 'Sell'
      : isClosingPosition
      ? `Close ${capitalize(positionSide)}`
      : `Open ${capitalize(positionSide)}`;

  const confirmTrade = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const action =
        tradeMode === 'spot'
          ? spotSide === 'buy'
            ? buyCoin
            : sellCoin
          : isClosingPosition
          ? closePosition
          : openPosition;

      const payload =
        tradeMode === 'spot'
          ? { symbol, quantity: parsedQuantity }
          : isClosingPosition
          ? { symbol, side: positionSide, quantity: parsedQuantity }
          : { symbol, side: positionSide, quantity: parsedQuantity, leverage: positionLeverage };

      const result = await action(payload);

      if (tradeMode === 'spot') {
        setSuccessMessage(
          `${spotSide === 'buy' ? 'Bought' : 'Sold'} ${parsedQuantity} ${symbol} at ${formatBDT(priceBDT)}`
        );
      } else if (isClosingPosition) {
        setSuccessMessage(
          `Closed ${parsedQuantity} ${symbol} ${positionSide} position at ${formatBDT(priceBDT)}`
        );
      } else {
        setSuccessMessage(
          `Opened ${positionSide} ${symbol} position with ${positionLeverage}x leverage at ${formatBDT(priceBDT)}`
        );
      }

      setQuantity('');
      await refreshWallet();
      onTradeComplete?.(result);
    } catch (err) {
      setError(err?.message || 'Trade failed. Please try again.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    tradeMode,
    spotSide,
    isClosingPosition,
    symbol,
    parsedQuantity,
    positionSide,
    positionLeverage,
    priceBDT,
    refreshWallet,
    onTradeComplete,
  ]);

  const disabledReason = !priceBDT
    ? 'Waiting for price…'
    : !hasValidQuantity
    ? `Enter a ${tradeMode === 'spot' ? 'quantity' : 'position size'}`
    : insufficientBalance
    ? tradeMode === 'spot'
      ? 'Insufficient balance'
      : 'Insufficient balance for margin'
    : insufficientHoldings
    ? `Not enough ${symbol}`
    : insufficientPositionQuantity
    ? 'Exceeds open position size'
    : null;

  const orderSummaryRows =
    tradeMode === 'spot'
      ? [
          { label: 'Live price', value: formatBDT(priceBDT) },
          { label: 'Subtotal', value: formatBDT(spotSubtotalBDT || 0) },
          { label: 'Fee', value: `${spotSide === 'buy' ? '+' : '−'}${formatBDT(spotFeeBDT || 0)}` },
          {
            label: spotSide === 'buy' ? 'Total cost' : 'Net proceeds',
            value: formatBDT(spotTotalBDT || 0),
            emphasized: true,
          },
        ]
      : isClosingPosition
      ? [
          { label: 'Live price', value: formatBDT(priceBDT) },
          { label: 'Entry price', value: formatBDT(activePosition?.entryPriceBDT) },
          { label: 'Margin released', value: formatBDT(closeMarginBDT || 0) },
          { label: 'Fee', value: `−${formatBDT(positionFeeBDT || 0)}` },
          { label: 'Est. close P/L', value: formatBDT(closeEffectivePnlBDT || 0) },
          {
            label: 'Estimated cash back',
            value: formatBDT(closeNetCreditBDT || 0),
            emphasized: true,
          },
        ]
      : [
          { label: 'Live price', value: formatBDT(priceBDT) },
          { label: 'Base value', value: formatBDT(positionBaseValueBDT || 0) },
          { label: 'Leverage', value: `${positionLeverage}x` },
          { label: 'Exposure', value: formatBDT(positionExposureBDT || 0) },
          { label: 'Fee', value: formatBDT(positionFeeBDT || 0) },
          {
            label: 'Margin required',
            value: formatBDT(positionOpenDebitBDT || 0),
            emphasized: true,
          },
        ];

  return (
    <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p className="section-label">Trade</p>
        <h3 className="section-title" style={{ fontSize: 18, marginTop: 4 }}>
          {symbol}
        </h3>
      </div>

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
          onClick={() => {
            setTradeMode('spot');
            setError(null);
            setSuccessMessage(null);
          }}
          style={{
            padding: '8px 0',
            borderRadius: 6,
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 150ms ease',
            backgroundColor: tradeMode === 'spot' ? 'var(--color-primary)' : 'transparent',
            color: tradeMode === 'spot' ? 'var(--color-on-primary)' : 'var(--color-muted)',
          }}
        >
          Spot
        </button>
        <button
          type="button"
          onClick={() => {
            setTradeMode('position');
            setError(null);
            setSuccessMessage(null);
          }}
          style={{
            padding: '8px 0',
            borderRadius: 6,
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 150ms ease',
            backgroundColor: tradeMode === 'position' ? 'var(--color-primary)' : 'transparent',
            color: tradeMode === 'position' ? 'var(--color-on-primary)' : 'var(--color-muted)',
          }}
        >
          Position
        </button>
      </div>

      {tradeMode === 'spot' ? (
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
            onClick={() => {
              setSpotSide('buy');
              setError(null);
              setSuccessMessage(null);
            }}
            style={{
              padding: '8px 0',
              borderRadius: 6,
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 150ms ease',
              backgroundColor: spotSide === 'buy' ? 'var(--color-up)' : 'transparent',
              color: spotSide === 'buy' ? '#fff' : 'var(--color-muted)',
            }}
          >
            ↑ Buy
          </button>
          <button
            type="button"
            id="trade-sell-tab"
            onClick={() => {
              setSpotSide('sell');
              setError(null);
              setSuccessMessage(null);
            }}
            style={{
              padding: '8px 0',
              borderRadius: 6,
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 150ms ease',
              backgroundColor: spotSide === 'sell' ? 'var(--color-down)' : 'transparent',
              color: spotSide === 'sell' ? '#fff' : 'var(--color-muted)',
            }}
          >
            ↓ Sell
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
              onClick={() => {
                setPositionSide('long');
                setError(null);
                setSuccessMessage(null);
              }}
              style={{
                padding: '8px 0',
                borderRadius: 6,
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                backgroundColor: positionSide === 'long' ? 'var(--color-up)' : 'transparent',
                color: positionSide === 'long' ? '#fff' : 'var(--color-muted)',
              }}
            >
              Long
            </button>
            <button
              type="button"
              onClick={() => {
                setPositionSide('short');
                setError(null);
                setSuccessMessage(null);
              }}
              style={{
                padding: '8px 0',
                borderRadius: 6,
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                backgroundColor: positionSide === 'short' ? 'var(--color-down)' : 'transparent',
                color: positionSide === 'short' ? '#fff' : 'var(--color-muted)',
              }}
            >
              Short
            </button>
          </div>

          {!isClosingPosition ? (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-hairline)',
                background: 'var(--color-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <p className="cs-label" style={{ marginBottom: 4 }}>
                    Leverage
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>
                    Multiplies position exposure and price swings up to 10x.
                  </p>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--color-ink)' }}>
                  {leverage}x
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          ) : (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-hairline)',
                background: 'var(--color-surface)',
                display: 'grid',
                gap: 8,
              }}
            >
              <div className="order-row">
                <span className="label">Position leverage</span>
                <span className="value">{positionLeverage}x</span>
              </div>
              <div className="order-row">
                <span className="label">Close uses</span>
                <span className="value">Open position terms</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label htmlFor="trade-quantity" className="cs-label">
            {tradeMode === 'spot' ? `Quantity (${symbol})` : `Position size (${symbol})`}
          </label>
          <input
            id="trade-quantity"
            type="number"
            min="0"
            max={tradeMode === 'position' && isClosingPosition ? closeableQuantity : undefined}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={
              tradeMode === 'position' && isClosingPosition
                ? `Up to ${formatQuantity(closeableQuantity)}`
                : '0.00000'
            }
            className="cs-input"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 15 }}
          />
          {tradeMode === 'position' && isClosingPosition && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
              Open {positionSide} position: {formatQuantity(activePosition?.quantity)} {symbol} at{' '}
              {formatBDT(activePosition?.entryPriceBDT)}. Closing quantity cannot exceed the open size.
            </p>
          )}
        </div>

        {tradeMode === 'position' && !isClosingPosition && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-up-bg)',
              border: '1px solid rgba(14, 203, 129, 0.25)',
              color: 'var(--color-ink)',
              fontSize: 13,
            }}
          >
            Margin is reserved from your cash balance, and the selected leverage expands both profit and loss on the
            position exposure.
          </div>
        )}

        {tradeMode === 'position' && isClosingPosition && activePosition && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-hairline)',
              display: 'grid',
              gap: 8,
            }}
          >
            <div className="order-row">
              <span className="label">Open side</span>
              <span className="value">{capitalize(activePosition.side)}</span>
            </div>
            <div className="order-row">
              <span className="label">Remaining size</span>
              <span className="value">
                {formatQuantity(activePosition.quantity)} {symbol}
              </span>
            </div>
            <div className="order-row">
              <span className="label">Unrealized P/L</span>
              <span className="value" style={{ color: activePosition.unrealizedPnlBDT >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}>
                {formatBDT(activePosition.unrealizedPnlBDT)}
              </span>
            </div>
          </div>
        )}

        <div className="order-summary">
          {orderSummaryRows.map((row) => (
            <div
              key={row.label}
              className="order-row"
              style={
                row.emphasized
                  ? {
                      paddingTop: 8,
                      marginTop: 6,
                      borderTop: '1px solid var(--color-hairline)',
                    }
                  : undefined
              }
            >
              <span className="label" style={row.emphasized ? { fontWeight: 600, color: 'var(--color-body)' } : undefined}>
                {row.label}
              </span>
              <span className="value" style={row.emphasized ? { fontSize: 15, color: 'var(--color-ink)' } : undefined}>
                {row.value}
              </span>
            </div>
          ))}
          {tradeMode === 'position' && isClosingPosition && (
            <div className="order-row">
              <span className="label">Leverage</span>
              <span className="value">{activePosition?.leverage ?? leverage}x</span>
            </div>
          )}
          {tradeMode === 'position' && !isClosingPosition && (
            <div className="order-row">
              <span className="label">Expected leverage swing</span>
              <span className="value">{positionLeverage}x</span>
            </div>
          )}
        </div>

        {tradeMode === 'spot' && (
          <>
            {spotSide === 'buy' ? (
              <div className="order-row">
                <span className="label">Available cash</span>
                <span className="value">{formatBDT(wallet?.cashBalanceBDT ?? 0)}</span>
              </div>
            ) : (
              <div className="order-row">
                <span className="label">Holdings</span>
                <span className="value" style={{ fontFamily: 'var(--font-mono)' }}>
                  {holdingQuantity} {symbol}
                </span>
              </div>
            )}
          </>
        )}

        {(insufficientBalance || insufficientHoldings || insufficientPositionQuantity) && (
          <p className="msg-error">
            {insufficientBalance
              ? tradeMode === 'spot'
                ? 'Insufficient balance for this trade.'
                : 'Insufficient balance to open this leveraged position.'
              : insufficientHoldings
              ? `You don't hold enough ${symbol} for this trade.`
              : `You cannot close more than your open ${positionSide} position.`}
          </p>
        )}
        {error && <p className="msg-error">{error}</p>}
        {successMessage && <p className="msg-success">{successMessage}</p>}

        <SlideButton
          label={disabledReason ?? `Slide to ${modeActionLabel} ${symbol}`}
          successLabel={
            tradeMode === 'spot'
              ? spotSide === 'buy'
                ? 'Bought'
                : 'Sold'
              : isClosingPosition
              ? 'Closed'
              : 'Opened'
          }
          errorLabel="Failed"
          disabled={!canSubmit}
          onConfirm={confirmTrade}
          className="text-base font-semibold"
        />
      </div>
    </div>
  );
}
