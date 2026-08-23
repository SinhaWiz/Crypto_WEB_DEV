import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCoins } from '../services/coinsService';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { COIN_META } from '../lib/coinMeta';

function formatBDT(value) {
  if (value === null || value === undefined) return '—';
  if (value >= 1000) {
    return `৳${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `৳${value.toFixed(value < 1 ? 6 : 4)}`;
}

export function MarketPage() {
  const navigate = useNavigate();
  const [initialCoins, setInitialCoins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listCoins()
      .then((coins) => { if (!cancelled) setInitialCoins(coins); })
      .catch(() => { if (!cancelled) setError('Could not load market data'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const { prices, flashes } = useMarketPrices(initialCoins);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
        <span className="spinner" />
      </div>
    );
  }

  if (error) {
    return <div className="msg-error">{error}</div>;
  }

  return (
    <div className="page-stack">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Cryptocurrency Market</h1>
          <p className="page-subtitle">Live simulated prices — updates every 3 seconds</p>
        </div>
        <span className="badge badge-live" style={{ fontSize: 13 }}>
          ● Live Simulation
        </span>
      </div>

      {/* ─── Markets Table Card ─── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Scrollable table container */}
        <div style={{ overflowX: 'auto' }}>
        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 160px 120px 120px 120px 96px',
            padding: '10px 16px',
            borderBottom: '1px solid var(--color-hairline)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          {['Coin', 'Price (BDT)', '24h Change', 'Volume 24h', 'Market Cap', ''].map((h, i) => (
            <span
              key={i}
              className="section-label"
              style={{ textAlign: i >= 1 ? 'right' : 'left', paddingRight: i === 5 ? 0 : 8 }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Table Rows */}
        {prices.map((coin) => {
          const isPositive = (coin.percentChange24h ?? 0) >= 0;
          const flash = flashes[coin.symbol];
          const meta = COIN_META[coin.symbol] ?? { glyph: coin.symbol[0], name: coin.symbol };

          return (
            <div
              key={coin.symbol}
              id={`market-row-${coin.symbol}`}
              onClick={() => navigate(`/market/${coin.symbol}`)}
              className={flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 160px 120px 120px 120px 96px',
                padding: '14px 16px',
                borderBottom: '1px solid var(--color-hairline)',
                cursor: 'pointer',
                transition: 'background-color 150ms ease',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* Coin name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className={`coin-icon coin-${coin.symbol}`}>
                  {meta.glyph}
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: 15, margin: 0 }}>
                    {coin.symbol}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>{meta.name}</p>
                </div>
              </div>

              {/* Price */}
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    fontSize: 15,
                    color: 'var(--color-ink)',
                  }}
                >
                  {formatBDT(coin.priceBDT)}
                </span>
                {flash === 'up' && <span style={{ color: 'var(--color-up)', marginLeft: 4, fontSize: 12 }}>▲</span>}
                {flash === 'down' && <span style={{ color: 'var(--color-down)', marginLeft: 4, fontSize: 12 }}>▼</span>}
              </div>

              {/* 24h Change */}
              <div style={{ textAlign: 'right' }}>
                {coin.percentChange24h !== null && coin.percentChange24h !== undefined ? (
                  <span
                    className={isPositive ? 'text-up' : 'text-down'}
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14 }}
                  >
                    {isPositive ? '+' : ''}{coin.percentChange24h.toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </div>

              {/* Volume */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-body)' }}>
                  {coin.volume24h ? `$${(coin.volume24h / 1e6).toFixed(1)}M` : '—'}
                </span>
              </div>

              {/* Market Cap */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-body)' }}>
                  {coin.marketCap ? `$${(coin.marketCap / 1e9).toFixed(1)}B` : '—'}
                </span>
              </div>

              {/* Trade button */}
              <div style={{ textAlign: 'right' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={(e) => { e.stopPropagation(); navigate(`/market/${coin.symbol}`); }}
                  id={`trade-btn-${coin.symbol}`}
                >
                  Trade
                </button>
              </div>
            </div>
          );
        })}
        </div>{/* end scrollable container */}
      </div>
    </div>
  );
}
