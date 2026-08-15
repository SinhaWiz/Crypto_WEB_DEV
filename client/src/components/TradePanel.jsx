import { useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { buyCoin, sellCoin } from '../services/tradeService';

function formatBDT(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `৳${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Buy/sell trade form for a single coin. Executes market orders against
 * the live simulated price and reports the wallet/holding update upward
 * so the parent page can refresh its own data.
 */
export function TradePanel({ symbol, priceBDT, holdingQuantity = 0, onTradeComplete }) {
  const { wallet, refreshWallet } = useAuth();
  const [side, setSide] = useState('buy');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const parsedQuantity = Number(quantity);
  const hasValidQuantity = quantity !== '' && Number.isFinite(parsedQuantity) && parsedQuantity > 0;
  const estimatedTotalBDT = hasValidQuantity && priceBDT ? parsedQuantity * priceBDT : 0;

  const cashBalanceBDT = wallet?.cashBalanceBDT ?? 0;
  const insufficientBalance = side === 'buy' && hasValidQuantity && estimatedTotalBDT > cashBalanceBDT;
  const insufficientHoldings = side === 'sell' && hasValidQuantity && parsedQuantity > holdingQuantity;
  const canSubmit = hasValidQuantity && !insufficientBalance && !insufficientHoldings && !isSubmitting && priceBDT;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const action = side === 'buy' ? buyCoin : sellCoin;
      const result = await action({ symbol, quantity: parsedQuantity });

      setSuccessMessage(
        `${side === 'buy' ? 'Bought' : 'Sold'} ${parsedQuantity} ${symbol} at ${formatBDT(priceBDT)}`
      );
      setQuantity('');
      await refreshWallet();
      onTradeComplete?.(result);
    } catch (err) {
      setError(err?.message || 'Trade failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Trade {symbol}</h3>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={() => setSide('buy')}
          className={`py-2 rounded-md text-sm font-semibold transition-colors ${
            side === 'buy' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide('sell')}
          className={`py-2 rounded-md text-sm font-semibold transition-colors ${
            side === 'sell' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="trade-quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Quantity ({symbol})
          </label>
          <input
            id="trade-quantity"
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="bg-gray-50 rounded-md p-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Live price</span>
            <span className="text-gray-900 font-medium">{formatBDT(priceBDT)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Estimated {side === 'buy' ? 'cost' : 'proceeds'}</span>
            <span className="text-gray-900 font-medium">{formatBDT(estimatedTotalBDT)}</span>
          </div>
          {side === 'buy' && (
            <div className="flex justify-between text-gray-500">
              <span>Available cash</span>
              <span className="text-gray-900 font-medium">{formatBDT(cashBalanceBDT)}</span>
            </div>
          )}
          {side === 'sell' && (
            <div className="flex justify-between text-gray-500">
              <span>Available holdings</span>
              <span className="text-gray-900 font-medium">{holdingQuantity} {symbol}</span>
            </div>
          )}
        </div>

        {insufficientBalance && (
          <p className="text-sm text-red-600">Insufficient balance for this trade.</p>
        )}
        {insufficientHoldings && (
          <p className="text-sm text-red-600">You don't hold enough {symbol} for this trade.</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-2.5 rounded-md text-sm font-semibold text-white transition-colors ${
            side === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? 'Placing order…' : side === 'buy' ? `Buy ${symbol}` : `Sell ${symbol}`}
        </button>
      </form>
    </div>
  );
}
