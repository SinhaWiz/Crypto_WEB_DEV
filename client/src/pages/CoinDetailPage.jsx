import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCoin, getCoinHistory } from '../services/coinsService';
import { buyCoin, sellCoin } from '../services/tradesService';
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
  const [tradeSide, setTradeSide] = useState('buy');
  const [quantity, setQuantity] = useState('');
  const [tradeMessage, setTradeMessage] = useState('');
  const [tradeError, setTradeError] = useState('');
  const [isSubmittingTrade, setIsSubmittingTrade] = useState(false);
  const { prices, series, connectionState } = useMarketPrices(coin ? [coin] : []);
  const liveCoin = prices[0];
  const livePriceBDT = liveCoin ? (liveCoin.priceBDT ?? liveCoin.price * BDT_PER_USD) : 0;
  const parsedQuantity = Number(quantity);
  const estimatedGrossBDT = Number.isFinite(parsedQuantity) ? parsedQuantity * livePriceBDT : 0;
  const estimatedFeeBDT = estimatedGrossBDT * 0.001;

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

  async function handleTradeSubmit(event) {
    event.preventDefault();
    setTradeMessage('');
    setTradeError('');

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setTradeError('Enter a quantity greater than zero');
      return;
    }

    setIsSubmittingTrade(true);

    try {
      const action = tradeSide === 'buy' ? buyCoin : sellCoin;
      await action({ symbol: normalizedSymbol, quantity: parsedQuantity });
      setTradeMessage(`${tradeSide === 'buy' ? 'Bought' : 'Sold'} ${parsedQuantity} ${normalizedSymbol}`);
      setQuantity('');
    } catch (err) {
      setTradeError(err.response?.data?.error?.message ?? 'Trade failed');
    } finally {
      setIsSubmittingTrade(false);
    }
  }

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
          <form className="trade-panel" onSubmit={handleTradeSubmit}>
            <div className="trade-panel-header">
              <h2>Trade {normalizedSymbol}</h2>
              <div className="segmented-control" aria-label="Trade side">
                <button
                  type="button"
                  className={tradeSide === 'buy' ? 'active' : ''}
                  onClick={() => setTradeSide('buy')}
                >
                  Buy
                </button>
                <button
                  type="button"
                  className={tradeSide === 'sell' ? 'active' : ''}
                  onClick={() => setTradeSide('sell')}
                >
                  Sell
                </button>
              </div>
            </div>
            <label>
              Quantity
              <input
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="0.00"
              />
            </label>
            <dl className="trade-estimate">
              <div>
                <dt>Live price</dt>
                <dd>{formatBDT(livePriceBDT)}</dd>
              </div>
              <div>
                <dt>Estimated value</dt>
                <dd>{formatBDT(estimatedGrossBDT)}</dd>
              </div>
              <div>
                <dt>Fee</dt>
                <dd>{formatBDT(estimatedFeeBDT)}</dd>
              </div>
            </dl>
            {tradeError && <p className="form-error">{tradeError}</p>}
            {tradeMessage && <p className="form-success">{tradeMessage}</p>}
            <button type="submit" disabled={isSubmittingTrade}>
              {isSubmittingTrade ? 'Submitting...' : `${tradeSide === 'buy' ? 'Buy' : 'Sell'} ${normalizedSymbol}`}
            </button>
          </form>
          <PriceChart points={chartPoints} />
        </>
      )}
    </div>
  );
}
