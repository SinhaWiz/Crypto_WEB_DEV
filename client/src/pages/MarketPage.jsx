import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCoins } from '../services/coinsService';

export function MarketPage() {
  const [coins, setCoins] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    listCoins()
      .then((data) => {
        if (!cancelled) setCoins(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load market data');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="market-page">
      <header className="dashboard-header">
        <h1>Market</h1>
        <Link to="/">Back to dashboard</Link>
      </header>

      {isLoading && <p>Loading market data...</p>}
      {error && <p className="form-error">{error}</p>}
      {!isLoading && !error && coins.length === 0 && <p>No market data available yet.</p>}

      {coins.length > 0 && (
        <ul className="coin-list">
          {coins.map((coin) => (
            <li key={coin.symbol} className="coin-card">
              <span className="coin-symbol">{coin.symbol}</span>
              <span className="coin-price">
                {coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
              </span>
              <span
                className={`coin-change ${coin.changePercent24h >= 0 ? 'positive' : 'negative'}`}
              >
                {coin.changePercent24h === null
                  ? '—'
                  : `${coin.changePercent24h >= 0 ? '+' : ''}${coin.changePercent24h.toFixed(2)}%`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
