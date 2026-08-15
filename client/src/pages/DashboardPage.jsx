import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { STARTING_BALANCE_BDT } from '../lib/constants';
import { getPortfolio } from '../services/tradeService';

function formatBDT(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `৳${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pnlColorClass(value) {
  if (value === null || value === undefined || value === 0) return 'text-gray-900';
  return value > 0 ? 'text-green-600' : 'text-red-600';
}

export function DashboardPage() {
  const { user, wallet } = useAuth();
  const [portfolio, setPortfolio] = useState(null);

  useEffect(() => {
    getPortfolio()
      .then(setPortfolio)
      .catch(() => setPortfolio(null));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome, {user?.name}!</h2>
        <p className="text-gray-600">
          This is your central dashboard. Start exploring the market and practice your trading strategies without any financial risk.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Wallet Overview Card */}
        <div className="bg-white shadow rounded-lg p-6 flex flex-col">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Virtual Wallet</h3>
          <div className="mt-2 flex-grow">
            <p className="text-sm text-gray-500">Available Balance</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">
              ৳{wallet?.cashBalanceBDT?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Initial starting balance: ৳{STARTING_BALANCE_BDT.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Portfolio summary */}
        <div className="bg-white shadow rounded-lg p-6 flex flex-col">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Portfolio Overview</h3>
          <div className="mt-2 flex-grow">
            <p className="text-sm text-gray-500">Market Value</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {formatBDT(portfolio?.totalValueBDT ?? 0)}
            </p>
            <p className={`text-sm font-medium mt-1 ${pnlColorClass(portfolio?.totalUnrealizedPnlBDT)}`}>
              {portfolio?.totalUnrealizedPnlBDT > 0 ? '+' : ''}
              {formatBDT(portfolio?.totalUnrealizedPnlBDT ?? 0)} unrealized
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link to="/portfolio" className="text-xs text-purple-600 hover:underline">
              View full portfolio →
            </Link>
          </div>
        </div>

        {/* Placeholder for future Gamification/Stats */}
        <div className="bg-white shadow rounded-lg p-6 flex flex-col opacity-75">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your Stats</h3>
          <div className="mt-2 flex-grow flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
            <p className="text-sm text-gray-500 italic">Predictions & Leaderboards coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
