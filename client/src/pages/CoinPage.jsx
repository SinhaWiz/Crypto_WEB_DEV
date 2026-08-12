import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCoinHistory } from '../services/coinsService';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function CoinPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get live price and series for this coin
  const { prices, flashes, series } = useMarketPrices([symbol]);
  const liveCoin = prices.find((p) => p.symbol === symbol);
  const liveSeries = series[symbol] || [];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getCoinHistory(symbol);
        // data should be an array of PriceHistory documents. Reverse to chronological order for the chart.
        const chronological = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setHistory(chronological);
      } catch (err) {
        setError(err.message || 'Failed to fetch coin history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [symbol]);

  if (loading) {
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
          &larr; Back to Market
        </button>
      </div>
    );
  }

  // Combine historical data with the latest live series
  const chartData = [...history.map(h => ({
    time: new Date(h.timestamp).toLocaleDateString(),
    price: h.close,
  }))];

  if (liveSeries.length > 0) {
    liveSeries.forEach((point) => {
      chartData.push({
        time: new Date(point.timestamp).toLocaleTimeString(),
        price: point.priceBDT,
      });
    });
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/market')} className="text-gray-500 hover:text-gray-900 transition-colors">
        &larr; Back to Market
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xl">
              {symbol[0]}
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">{symbol}</h2>
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded animate-pulse inline-block mt-1">
                Live Simulation
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Current Price</p>
            <p className="text-4xl font-extrabold text-gray-900 flex items-center justify-end">
              ${liveCoin?.priceBDT?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) || '0.00'}
              {flashes[symbol] === 'up' && <span className="text-green-500 text-2xl ml-2">↑</span>}
              {flashes[symbol] === 'down' && <span className="text-red-500 text-2xl ml-2">↓</span>}
            </p>
          </div>
        </div>

        <div className="h-96 w-full mt-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis 
                domain={['auto', 'auto']} 
                tick={{ fill: '#6b7280', fontSize: 12 }} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value) => [`$${value}`, 'Price']}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false} // Disable animation for live ticks to prevent jerky resets
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
