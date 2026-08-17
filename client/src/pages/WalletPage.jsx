import { useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { POINTS_EXCHANGE_RATE_BDT, TRADE_FEE_RATE } from '../lib/constants';
import { buyPoints } from '../services/walletService';

function formatBDT(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `৳${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function WalletPage() {
  const { wallet, refreshWallet } = useAuth();
  const [pointsToBuy, setPointsToBuy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const parsedPoints = Number(pointsToBuy);
  const hasValidPoints = pointsToBuy !== '' && Number.isFinite(parsedPoints) && parsedPoints > 0;
  const costBDT = hasValidPoints ? parsedPoints * POINTS_EXCHANGE_RATE_BDT : 0;
  const availableCashBDT = wallet?.cashBalanceBDT ?? 0;
  const insufficientCash = hasValidPoints && costBDT > availableCashBDT;
  const canSubmit = hasValidPoints && !insufficientCash && !isSubmitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await buyPoints({ pointsToBuy: parsedPoints });
      setSuccessMessage(`Purchased ${parsedPoints} point(s) for ${formatBDT(costBDT)}.`);
      setPointsToBuy('');
      await refreshWallet();
    } catch (err) {
      setError(err?.message || 'Could not buy points. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Wallet</h2>
        <p className="text-gray-500 text-sm mt-1">
          Manage your cash balance and buy virtual points to stake on predictions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="points-to-buy" className="block text-sm font-medium text-gray-700 mb-1">
                Points to buy
              </label>
              <input
                id="points-to-buy"
                type="number"
                min="0"
                step="1"
                value={pointsToBuy}
                onChange={(e) => setPointsToBuy(e.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Rate: 1 point = {formatBDT(POINTS_EXCHANGE_RATE_BDT)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-md p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Cost</span>
                <span className="font-medium text-gray-900">{formatBDT(costBDT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Available balance</span>
                <span className="font-medium text-gray-900">{formatBDT(availableCashBDT)}</span>
              </div>
            </div>

            {insufficientCash && (
              <p className="text-sm text-red-600">You don't have enough cash balance for this purchase.</p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-2.5 rounded-md text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Buying points…' : 'Buy Points'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Your balances</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Cash</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{formatBDT(availableCashBDT)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Points</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{wallet?.virtualPoints ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">How it works</h3>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>Points are used to stake predictions.</li>
              <li>1 point costs {formatBDT(POINTS_EXCHANGE_RATE_BDT)} of your cash balance.</li>
              <li>Buying and selling coins carries a {(TRADE_FEE_RATE * 100).toFixed(1)}% platform fee.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
