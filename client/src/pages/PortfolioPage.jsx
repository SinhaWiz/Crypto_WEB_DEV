import { useEffect, useState, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getPortfolio, getTransactions } from '../services/tradeService';

const ALLOCATION_COLORS = ['#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

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

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [transactionsPage, setTransactionsPage] = useState(null);
  const [transactionsPageNumber, setTransactionsPageNumber] = useState(1);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

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

  useEffect(() => {
    setIsLoadingTransactions(true);
    getTransactions({ page: transactionsPageNumber, limit: 10 })
      .then(setTransactionsPage)
      .catch(() => setTransactionsPage(null))
      .finally(() => setIsLoadingTransactions(false));
  }, [transactionsPageNumber]);

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
        <button onClick={loadPortfolio} className="mt-4 text-purple-600 hover:underline text-sm">
          Try again
        </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {holdings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-500 text-sm lg:col-span-3">
          You don't hold any coins yet. Head to the market to place your first trade.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Allocation</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={holdings}
                    dataKey="marketValueBDT"
                    nameKey="symbol"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {holdings.map((holding, index) => (
                      <Cell key={holding.symbol} fill={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatBDT(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
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
          </div>
        </>
      )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Transaction History</h3>
        </div>

        {isLoadingTransactions ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading transactions…</div>
        ) : !transactionsPage || transactionsPage.transactions.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">No transactions yet.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Side</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Execution Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactionsPage.transactions.map((tx) => (
                    <tr key={tx._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{formatDate(tx.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{tx.symbol}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            tx.side === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tx.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">{tx.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">{formatBDT(tx.executionPriceBDT)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                        {formatBDT(tx.executionPriceBDT * tx.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 text-sm">
              <span className="text-gray-500">
                Page {transactionsPage.page} of {transactionsPage.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTransactionsPageNumber((p) => Math.max(1, p - 1))}
                  disabled={transactionsPage.page <= 1}
                  className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionsPageNumber((p) => Math.min(transactionsPage.totalPages, p + 1))}
                  disabled={transactionsPage.page >= transactionsPage.totalPages}
                  className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
