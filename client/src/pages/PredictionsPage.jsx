import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { SUPPORTED_SYMBOLS } from '../lib/constants';
import { getCoin } from '../services/coinsService';
import { placePrediction, getPredictionHistory } from '../services/predictionService';

const DURATION_PRESETS = [
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '1 hour', minutes: 60 },
  { label: '24 hours', minutes: 1440 },
];

function formatBDT(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `৳${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

function resultBadgeClass(result) {
  if (result === 'win') return 'bg-green-100 text-green-800';
  if (result === 'loss') return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
}

export function PredictionsPage() {
  const { wallet, refreshWallet } = useAuth();
  const [symbol, setSymbol] = useState(SUPPORTED_SYMBOLS[0]);
  const [direction, setDirection] = useState('up');
  const [pointsStaked, setPointsStaked] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(DURATION_PRESETS[0].minutes);
  const [currentPriceBDT, setCurrentPriceBDT] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [historyPage, setHistoryPage] = useState(null);
  const [historyPageNumber, setHistoryPageNumber] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const loadHistory = useCallback(() => {
    setIsLoadingHistory(true);
    getPredictionHistory({ page: historyPageNumber, limit: 10 })
      .then(setHistoryPage)
      .catch(() => setHistoryPage(null))
      .finally(() => setIsLoadingHistory(false));
  }, [historyPageNumber]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    let cancelled = false;
    getCoin(symbol)
      .then((coin) => {
        if (!cancelled) setCurrentPriceBDT(coin.priceBDT);
      })
      .catch(() => {
        if (!cancelled) setCurrentPriceBDT(null);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const parsedPoints = Number(pointsStaked);
  const hasValidPoints = pointsStaked !== '' && Number.isFinite(parsedPoints) && parsedPoints > 0;
  const availablePoints = wallet?.virtualPoints ?? 0;
  const insufficientPoints = hasValidPoints && parsedPoints > availablePoints;
  const canSubmit = hasValidPoints && !insufficientPoints && !isSubmitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await placePrediction({ symbol, direction, pointsStaked: parsedPoints, durationMinutes });
      setSuccessMessage(
        `Prediction placed: ${symbol} will go ${direction} within ${durationMinutes} minutes.`
      );
      setPointsStaked('');
      await refreshWallet();
      loadHistory();
    } catch (err) {
      setError(err?.message || 'Could not place prediction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Predictions</h2>
        <p className="text-gray-500 text-sm mt-1">
          Stake virtual points on where a coin's price is headed. Correct calls double your stake.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="prediction-symbol" className="block text-sm font-medium text-gray-700 mb-1">
                Coin
              </label>
              <select
                id="prediction-symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {SUPPORTED_SYMBOLS.map((sym) => (
                  <option key={sym} value={sym}>
                    {sym}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Current price: {formatBDT(currentPriceBDT)}</p>
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">Direction</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('up')}
                  className={`py-2 rounded-md text-sm font-semibold transition-colors ${
                    direction === 'up' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ↑ Up
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('down')}
                  className={`py-2 rounded-md text-sm font-semibold transition-colors ${
                    direction === 'down' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ↓ Down
                </button>
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">Closes in</span>
              <div className="grid grid-cols-4 gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.minutes}
                    type="button"
                    onClick={() => setDurationMinutes(preset.minutes)}
                    className={`py-2 rounded-md text-xs font-semibold transition-colors ${
                      durationMinutes === preset.minutes
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="prediction-points" className="block text-sm font-medium text-gray-700 mb-1">
                Points to stake
              </label>
              <input
                id="prediction-points"
                type="number"
                min="0"
                step="1"
                value={pointsStaked}
                onChange={(e) => setPointsStaked(e.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">Available points: {availablePoints}</p>
            </div>

            {insufficientPoints && (
              <p className="text-sm text-red-600">You don't have enough points for this stake.</p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-2.5 rounded-md text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Placing prediction…' : 'Place Prediction'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">How it works</h3>
          <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
            <li>Pick a coin, a direction, and how many points to stake.</li>
            <li>Your prediction is judged against your own simulated price feed.</li>
            <li>Win: get double your stake back. Lose: forfeit the stake.</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Your Predictions</h3>
        </div>

        {isLoadingHistory ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading predictions…</div>
        ) : !historyPage || historyPage.predictions.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">No predictions yet.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Staked</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Start Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">End Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyPage.predictions.map((prediction) => (
                    <tr key={prediction._id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{prediction.symbol}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {prediction.direction === 'up' ? '↑ Up' : '↓ Down'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">{prediction.pointsStaked}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">{formatBDT(prediction.startPriceBDT)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">{formatBDT(prediction.endPriceBDT)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{formatDate(prediction.closesAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${resultBadgeClass(prediction.result)}`}>
                          {prediction.result.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 text-sm">
              <span className="text-gray-500">
                Page {historyPage.page} of {historyPage.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHistoryPageNumber((p) => Math.max(1, p - 1))}
                  disabled={historyPage.page <= 1}
                  className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryPageNumber((p) => Math.min(historyPage.totalPages, p + 1))}
                  disabled={historyPage.page >= historyPage.totalPages}
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
