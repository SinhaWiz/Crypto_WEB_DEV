import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCoin, getCoinHistory } from '../services/coinsService';
import { useMarketPrices } from '../hooks/useMarketPrices';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function formatBDT(value) {
  if (value === null || value === undefined) return '—';
  return `৳${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CoinPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const normalizedSymbol = symbol.toUpperCase();

  const [initialCoin, setInitialCoin] = useState(null);
  const [candles, setCandles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial coin snapshot + historical candles from REST
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
      .catch(() => {
        if (!cancelled) setError('Could not load coin data');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [normalizedSymbol]);

  // Subscribe to live ticks for this coin (seed with initial coin data)
  const { prices, flashes, series } = useMarketPrices(initialCoin ? [initialCoin] : []);
  const liveCoin = prices.find((p) => p.symbol === normalizedSymbol) ?? initialCoin;
  const liveSeries = series[normalizedSymbol] ?? [];

  // Build chart data: historical candles (close price) + live simulation ticks
  const chartData = useMemo(() => {
    const historicalPoints = candles.map((candle) => ({
      time: new Date(candle.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      price: candle.close, // already in BDT from the server
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

  // Session high / low from live ticks
  const liveValues = liveSeries.map((p) => p.priceBDT);
  const sessionHigh = liveValues.length ? Math.max(...liveValues) : null;
  const sessionLow = liveValues.length ? Math.min(...liveValues) : null;

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
        <button onClick={() => navigate('/market')} className="mt-4 text-purple-600 hover:underline">
          ← Back to Market
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/market')}
        className="text-gray-500 hover:text-gray-900 transition-colors"
      >
        ← Back to Market
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xl">
              {normalizedSymbol[0]}
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">{normalizedSymbol}</h2>
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded animate-pulse inline-block mt-1">
                Live Simulation
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Simulated Price</p>
            <p className="text-4xl font-extrabold text-gray-900 flex items-center justify-end">
              {formatBDT(liveCoin?.priceBDT)}
              {flash === 'up' && <span className="text-green-500 text-2xl ml-2">↑</span>}
              {flash === 'down' && <span className="text-red-500 text-2xl ml-2">↓</span>}
            </p>
            {liveCoin?.percentChange24h !== null && liveCoin?.percentChange24h !== undefined && (
              <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{liveCoin.percentChange24h.toFixed(2)}% (24h)
              </span>
            )}
          </div>
        </div>

        {/* Session stats */}
        {(sessionHigh !== null || sessionLow !== null) && (
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500">Session High</p>
              <p className="text-sm font-semibold text-green-600">{formatBDT(sessionHigh)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Session Low</p>
              <p className="text-sm font-semibold text-red-600">{formatBDT(sessionLow)}</p>
            </div>
          </div>
        )}

        {/* Chart: historical candles + live ticks */}
        <div className="h-80 w-full mt-4">
          {chartData.length < 2 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400 mb-3"></div>
              <p className="text-sm">Loading chart data…</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    v >= 100000
                      ? `৳${(v / 1000).toFixed(0)}k`
                      : v >= 1000
                      ? `৳${(v / 1000).toFixed(1)}k`
                      : `৳${v.toFixed(v < 1 ? 4 : 2)}`
                  }
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value) => [formatBDT(value), 'Price']}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Historical daily candles + live simulation ticks · All prices in virtual BDT
        </p>
      </div>
    </div>
  );
}
