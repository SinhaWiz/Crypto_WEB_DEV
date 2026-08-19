import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCoin, getCoinHistory } from '../services/coinsService';
import { getPortfolio } from '../services/tradeService';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { TradePanel } from '../components/TradePanel';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COIN_META = {
  BTC: { symbol: '₿', name: 'Bitcoin' },
  ETH: { symbol: 'Ξ', name: 'Ethereum' },
  SOL: { symbol: '◎', name: 'Solana' },
  DOGE: { symbol: 'Ð', name: 'Dogecoin' },
  XRP: { symbol: '✕', name: 'XRP' },
  BNB: { symbol: '⬢', name: 'BNB' },
};

function formatBDT(value) {
  if (value === null || value === undefined) return '—';
  return `৳${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-hairline)',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: 'var(--shadow-elevated)',
      }}
    >
      <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '0 0 4px' }}>
        {payload[0]?.payload?.time}
      </p>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', margin: 0 }}>
        {formatBDT(payload[0]?.value)}
      </p>
    </div>
  );
}

export function CoinPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const normalizedSymbol = symbol.toUpperCase();
  const meta = COIN_META[normalizedSymbol] ?? { symbol: normalizedSymbol[0], name: normalizedSymbol };

  const [initialCoin, setInitialCoin] = useState(null);
  const [candles, setCandles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [holdingQuantity, setHoldingQuantity] = useState(0);

  const refreshHolding = useCallback(() => {
    getPortfolio()
      .then((data) => {
        const holding = data.holdings.find((h) => h.symbol === normalizedSymbol);
        setHoldingQuantity(holding?.quantity ?? 0);
      })
      .catch(() => {});
  }, [normalizedSymbol]);

  useEffect(() => { refreshHolding(); }, [refreshHolding]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([getCoin(normalizedSymbol), getCoinHistory(normalizedSymbol)])
      .then(([coinData, historyData]) => {
        if (cancelled) return;
        setInitialCoin(coinData);
        setCandles(historyData ?? []);
      })
      .catch(() => { if (!cancelled) setError('Could not load coin data'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [normalizedSymbol]);

  const { prices, flashes, series } = useMarketPrices(initialCoin ? [initialCoin] : []);
  const liveCoin = prices.find((p) => p.symbol === normalizedSymbol) ?? initialCoin;
  const liveSeries = series[normalizedSymbol] ?? [];

  const chartData = useMemo(() => {
    const historicalPoints = candles.map((candle) => ({
      time: new Date(candle.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      price: candle.close,
      type: 'historical',
    }));
    const livePoints = liveSeries.map((point) => ({
      time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price: point.priceBDT,
      type: 'live',
    }));
    return [...historicalPoints, ...livePoints];
  }, [candles, liveSeries]);

  const isPositive = (liveCoin?.percentChange24h ?? 0) >= 0;
  const flash = flashes[normalizedSymbol];
  const liveValues = liveSeries.map((p) => p.priceBDT);
  const sessionHigh = liveValues.length ? Math.max(...liveValues) : null;
  const sessionLow = liveValues.length ? Math.min(...liveValues) : null;

  // Chart line color based on overall trend
  const chartColor = isPositive ? 'var(--color-up)' : 'var(--color-down)';

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
        <span className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="msg-error" style={{ marginBottom: 16 }}>{error}</div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/market')}>
          ← Back to Market
        </button>
      </div>
    );
  }

  return (
    <div className="page-stack">
      {/* Back link */}
      <button
        onClick={() => navigate('/market')}
        className="btn btn-ghost btn-sm"
        style={{ alignSelf: 'flex-start' }}
        id="coin-back-btn"
      >
        ← Market
      </button>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* ─── Left: Chart Card ─── */}
        <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Coin Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className={`coin-icon coin-icon-sm coin-${normalizedSymbol}`} style={{ width: 44, height: 44, fontSize: 18 }}>
                {meta.symbol}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 className="page-title" style={{ fontSize: 22, margin: 0 }}>
                    {normalizedSymbol}
                  </h1>
                  <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{meta.name}</span>
                </div>
                <span className="badge badge-live" style={{ marginTop: 4, fontSize: 11 }}>
                  ● Live Simulation
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <p
                id={`coin-price-${normalizedSymbol}`}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 30,
                  fontWeight: 700,
                  color: 'var(--color-ink)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  justifyContent: 'flex-end',
                }}
              >
                {formatBDT(liveCoin?.priceBDT)}
                {flash === 'up' && <span style={{ color: 'var(--color-up)', fontSize: 18 }}>▲</span>}
                {flash === 'down' && <span style={{ color: 'var(--color-down)', fontSize: 18 }}>▼</span>}
              </p>
              {liveCoin?.percentChange24h !== null && liveCoin?.percentChange24h !== undefined && (
                <p
                  className={isPositive ? 'text-up' : 'text-down'}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, margin: '4px 0 0' }}
                >
                  {isPositive ? '+' : ''}{liveCoin.percentChange24h.toFixed(2)}% (24h)
                </p>
              )}
            </div>
          </div>

          {/* Session stats */}
          {(sessionHigh !== null || sessionLow !== null) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                padding: '12px 16px',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 2 }}>Session High</p>
                <p className="text-up" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14 }}>
                  {formatBDT(sessionHigh)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 2 }}>Session Low</p>
                <p className="text-down" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14 }}>
                  {formatBDT(sessionLow)}
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          <div style={{ height: 320 }}>
            {chartData.length < 2 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                <span className="spinner" />
                <p className="text-muted" style={{ fontSize: 13 }}>Loading chart…</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-hairline)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: 'var(--color-muted)', fontSize: 11, fontFamily: 'var(--font-body)' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fill: 'var(--color-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      v >= 100000
                        ? `৳${(v / 1000).toFixed(0)}k`
                        : v >= 1000
                        ? `৳${(v / 1000).toFixed(1)}k`
                        : `৳${v.toFixed(v < 1 ? 4 : 2)}`
                    }
                    width={76}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={chartColor}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: chartColor, stroke: 'var(--color-canvas)', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <p style={{ fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
            Historical daily candles + live simulation ticks · All prices in virtual BDT
          </p>
        </div>

        {/* ─── Right: Trade Panel ─── */}
        <TradePanel
          symbol={normalizedSymbol}
          priceBDT={liveCoin?.priceBDT}
          holdingQuantity={holdingQuantity}
          onTradeComplete={refreshHolding}
        />
      </div>
    </div>
  );
}
