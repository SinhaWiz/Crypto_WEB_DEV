import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCoins } from '../services/coinsService';
import { useMarketPrices } from '../hooks/useMarketPrices';

const COIN_BADGES = {
  BTC: { icon: '₿', className: 'bg-amber-100 text-amber-700' },
  ETH: { icon: 'Ξ', className: 'bg-slate-100 text-slate-700' },
  SOL: { icon: '◎', className: 'bg-violet-100 text-violet-700' },
  DOGE: { icon: 'Ð', className: 'bg-yellow-100 text-yellow-700' },
  XRP: { icon: '✕', className: 'bg-cyan-100 text-cyan-700' },
  BNB: { icon: '⬢', className: 'bg-orange-100 text-orange-700' },
};

export function MarketPage() {
  const navigate = useNavigate();
  const [initialCoins, setInitialCoins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial snapshot from REST so prices show immediately (before socket tick)
  useEffect(() => {
    let cancelled = false;
    listCoins()
      .then((coins) => { if (!cancelled) setInitialCoins(coins); })
      .catch(() => { if (!cancelled) setError('Could not load market data'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Pass initial coins to the hook — live ticks will update them in place
  const { prices, flashes } = useMarketPrices(initialCoins);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Cryptocurrency Market</h2>
        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded animate-pulse">
          Live Simulation
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prices.map((coin) => {
          const isPositive = (coin.percentChange24h ?? 0) >= 0;
          const flash = flashes[coin.symbol];
          const flashClass =
            flash === 'up'
              ? 'bg-green-50 transition-colors duration-300'
              : flash === 'down'
              ? 'bg-red-50 transition-colors duration-300'
              : 'bg-white transition-colors duration-1000';

          return (
            <div
              key={coin.symbol}
              onClick={() => navigate(`/market/${coin.symbol}`)}
              className={`rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md cursor-pointer ${flashClass}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${COIN_BADGES[coin.symbol]?.className ?? 'bg-purple-100 text-purple-700'}`}
                    aria-hidden="true"
                    title={`${coin.symbol} icon`}
                  >
                    {COIN_BADGES[coin.symbol]?.icon ?? coin.symbol[0]}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-bold text-gray-900">{coin.symbol}</h3>
                  </div>
                </div>
                {coin.percentChange24h !== null && coin.percentChange24h !== undefined && (
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                      isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {isPositive ? '+' : ''}{coin.percentChange24h.toFixed(2)}%
                  </span>
                )}
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">Simulated Price</p>
                <p className="text-3xl font-extrabold text-gray-900 flex items-center">
                  ৳{coin.priceBDT?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
                  {flash === 'up' && <span className="text-green-500 text-xl ml-2">↑</span>}
                  {flash === 'down' && <span className="text-red-500 text-xl ml-2">↓</span>}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                <div>
                  <p className="text-xs text-gray-500">Vol 24h</p>
                  <p className="text-sm font-medium text-gray-900">
                    {coin.volume24h ? `$${(coin.volume24h / 1e6).toFixed(2)}M` : '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Market Cap</p>
                  <p className="text-sm font-medium text-gray-900">
                    {coin.marketCap ? `$${(coin.marketCap / 1e9).toFixed(2)}B` : '—'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
