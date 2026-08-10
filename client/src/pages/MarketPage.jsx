import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCoins } from '../services/coinsService';
import { useMarketPrices } from '../hooks/useMarketPrices';

export function MarketPage() {
  const [coins, setCoins] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { prices: liveCoins, flashes, connectionState } = useMarketPrices(coins);

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
      <p className={`connection-state ${connectionState}`}>{connectionState}</p>

      {isLoading && <p>Loading market data...</p>}
      {error && <p className="form-error">{error}</p>}
      {!isLoading && !error && coins.length === 0 && <p>No market data available yet.</p>}

      {liveCoins.length > 0 && (
        <ul className="coin-list">
          {liveCoins.map((coin) => {
            const price = coin.priceBDT ?? coin.price;
            return (
              <li key={coin.symbol} className={`coin-card ${flashes[coin.symbol] ?? ''}`}>
                <Link to={`/market/${coin.symbol}`} className="coin-symbol">
                  {coin.symbol}
                </Link>
                <span className="coin-price">
                  {price.toLocaleString(undefined, { maximumFractionDigits: 2 })} BDT
                </span>
                <span
                  className={`coin-change ${coin.changePercent24h >= 0 ? 'positive' : 'negative'}`}
                >
                  {coin.changePercent24h === null || coin.changePercent24h === undefined
                    ? 'live'
                    : `${coin.changePercent24h >= 0 ? '+' : ''}${coin.changePercent24h.toFixed(2)}%`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
