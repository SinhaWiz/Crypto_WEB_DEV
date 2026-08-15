import { useEffect, useState, useCallback } from 'react';
import { getPortfolio } from '../services/tradeService';

function formatBDT(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `৳${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatSignedBDT(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatBDT(value)}`;
}

function formatSignedPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function pnlColorClass(value) {
  if (value === null || value === undefined || value === 0) return 'text-gray-700';
  return value > 0 ? 'text-green-600' : 'text-red-600';
}

export function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPortfolio = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getPortfolio()
      .then(setPortfolio)
      .catch(() => setError('Could not load portfolio'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

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

  const holdings = portfolio?.holdings ?? [];
  const totalValueBDT = portfolio?.totalValueBDT ?? 0;
  const totalCostBDT = portfolio?.totalCostBDT ?? 0;
  const totalUnrealizedPnlBDT = portfolio?.totalUnrealizedPnlBDT ?? 0;
  const totalUnrealizedPnlPercent = totalCostBDT > 0 ? (totalUnrealizedPnlBDT / totalCostBDT) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Portfolio</h2>
        <p className="text-gray-500 text-sm mt-1">Your holdings, valued at live simulated prices.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Market Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatBDT(totalValueBDT)}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Cost Basis</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatBDT(totalCostBDT)}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Unrealized P/L</p>
          <p className={`text-2xl font-bold mt-1 ${pnlColorClass(totalUnrealizedPnlBDT)}`}>
            {formatSignedBDT(totalUnrealizedPnlBDT)}
          </p>
          <p className={`text-xs mt-0.5 ${pnlColorClass(totalUnrealizedPnlBDT)}`}>
            {formatSignedPercent(totalUnrealizedPnlPercent)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {holdings.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">
            You don't hold any coins yet. Head to the market to place your first trade.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coin</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Buy Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Market Value</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unrealized P/L</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Realized P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {holdings.map((holding) => (
                  <tr key={holding.symbol}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{holding.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">{holding.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">{formatBDT(holding.averageBuyPriceBDT)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">{formatBDT(holding.currentPriceBDT)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">{formatBDT(holding.marketValueBDT)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${pnlColorClass(holding.unrealizedPnlBDT)}`}>
                      {formatSignedBDT(holding.unrealizedPnlBDT)}
                      <span className="block text-xs font-normal">{formatSignedPercent(holding.unrealizedPnlPercent)}</span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${pnlColorClass(holding.realizedPnlBDT)}`}>
                      {formatSignedBDT(holding.realizedPnlBDT)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
