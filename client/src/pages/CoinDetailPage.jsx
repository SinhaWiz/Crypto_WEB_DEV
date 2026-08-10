import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCoin, getCoinHistory } from '../services/coinsService';
import { useMarketPrices } from '../hooks/useMarketPrices';

const BDT_PER_USD = 120;

function formatBDT(value) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} BDT`;
}

function PriceChart({ points }) {
  const width = 720;
  const height = 260;
  const padding = 24;

  if (points.length < 2) {
    return <div className="chart-empty">Waiting for enough chart data...</div>;
  }

  const values = points.map((point) => point.priceBDT);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const path = points
    .map((point, index) => {
      const x = padding + (index / (points.length - 1)) * (width - padding * 2);
      const y = height - padding - ((point.priceBDT - min) / range) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg className="price-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Price chart">
      <path d={path} />
      <text x={padding} y={padding}>
        {formatBDT(max)}
      </text>
      <text x={padding} y={height - 8}>
        {formatBDT(min)}
      </text>
    </svg>
  );
}

export function CoinDetailPage() {
  const { symbol = '' } = useParams();
  const normalizedSymbol = symbol.toUpperCase();
  const [coin, setCoin] = useState(null);
  const [candles, setCandles] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { prices, series, connectionState } = useMarketPrices(coin ? [coin] : []);
  const liveCoin = prices[0];

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError('');

    Promise.all([
      getCoin(normalizedSymbol),
      getCoinHistory(normalizedSymbol, { interval: '1h', limit: 96 }),
    ])
      .then(([coinData, historyData]) => {
        if (cancelled) return;
        setCoin(coinData);
        setCandles(historyData);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load coin details');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [normalizedSymbol]);

  const chartPoints = useMemo(() => {
    const historicalPoints = candles.map((candle) => ({
      priceBDT: candle.close * BDT_PER_USD,
      timestamp: candle.timestamp,
    }));
    const livePoints = series[normalizedSymbol] ?? [];

    return [...historicalPoints, ...livePoints];
  }, [candles, normalizedSymbol, series]);

  return (
    <div className="coin-detail-page">
      <header className="dashboard-header">
        <div>
          <h1>{normalizedSymbol}</h1>
          <p className={`connection-state ${connectionState}`}>{connectionState}</p>
        </div>
        <Link to="/market">Back to market</Link>
      </header>

      {isLoading && <p>Loading coin...</p>}
      {error && <p className="form-error">{error}</p>}

      {!isLoading && !error && liveCoin && (
        <>
          <section className="coin-detail-summary">
            <p className="wallet-balance">{formatBDT(liveCoin.priceBDT ?? liveCoin.price * BDT_PER_USD)}</p>
            <p>
              {liveCoin.changePercent24h === null || liveCoin.changePercent24h === undefined
                ? 'Live simulated price'
                : `${liveCoin.changePercent24h >= 0 ? '+' : ''}${liveCoin.changePercent24h.toFixed(2)}% over 24h`}
            </p>
          </section>
          <PriceChart points={chartPoints} />
        </>
      )}
    </div>
  );
}
