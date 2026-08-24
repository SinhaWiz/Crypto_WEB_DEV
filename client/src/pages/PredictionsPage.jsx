import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { SUPPORTED_SYMBOLS } from '../lib/constants';
import { COIN_META } from '../lib/coinMeta';
import { listCoins, getCoinHistory } from '../services/coinsService';
import { placePrediction, getPredictionHistory } from '../services/predictionService';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { PredictionMarket } from '../components/ui/be-ui-prediction-market';
import { MarketWatchlist } from '../components/ui/market-watchlist';

const PREDICTION_OUTCOMES = [
  { id: 'up', label: 'Up', price: 0.5 },
  { id: 'down', label: 'Down', price: 0.5 },
];

const DURATION_PRESETS = [
  { label: '15 sec', minutes: 0.25 },
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
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function ResultBadge({ result }) {
  if (result === 'win') return <span className="badge badge-up">WIN</span>;
  if (result === 'loss') return <span className="badge badge-down">LOSS</span>;
  return <span className="badge badge-pending">PENDING</span>;
}

export function PredictionsPage() {
  const { wallet, refreshWallet, mode: priceMode } = useAuth();
  const isReal = priceMode === 'real';
  const [symbol, setSymbol] = useState(SUPPORTED_SYMBOLS[0]);
  const [mode, setMode] = useState('buy');
  const [direction, setDirection] = useState('up');
  const [pointsStaked, setPointsStaked] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(DURATION_PRESETS[0].minutes);

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

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const [initialCoins, setInitialCoins] = useState([]);
  useEffect(() => {
    let cancelled = false;
    listCoins().then((coins) => { if (!cancelled) setInitialCoins(coins); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const [chartHistory, setChartHistory] = useState({});
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      SUPPORTED_SYMBOLS.map((sym) =>
        getCoinHistory(sym)
          .then((candles) => [sym, candles.slice(-30)])
          .catch(() => [sym, []]),
      ),
    ).then((entries) => { if (!cancelled) setChartHistory(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
  }, []);

  const { prices: livePrices, series, flashes } = useMarketPrices(
    initialCoins.length ? initialCoins : SUPPORTED_SYMBOLS,
  );
  const selectedCoin = livePrices.find((c) => c.symbol === symbol);
  const currentPriceBDT = selectedCoin?.priceBDT ?? null;
  const selectedMeta = COIN_META[symbol] ?? { glyph: symbol[0], name: symbol };

  const availablePoints = wallet?.virtualPoints ?? 0;
  const selectedPreset = DURATION_PRESETS.find((p) => p.minutes === durationMinutes) ?? DURATION_PRESETS[0];

  const handleTrade = useCallback(async (order, quote) => {
    if (order.mode !== 'buy') {
      throw new Error('Selling is not available for predictions.');
    }
    await placePrediction({
      symbol,
      direction: order.outcomeId,
      pointsStaked: quote.amount,
      durationMinutes,
    });
    setPointsStaked('');
    await refreshWallet();
    loadHistory();
  }, [symbol, durationMinutes, refreshWallet, loadHistory]);

  return (
    <div className="page-stack">
      {/* Header */}
      <div>
        <h1 className="page-title">Predictions</h1>
        <p className="page-subtitle">
          Stake virtual points on where a coin's price is headed. Correct calls double your stake.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[320px_400px_1fr]">
        {/* ─── Market Watchlist ─── */}
        <MarketWatchlist
          coins={livePrices}
          history={chartHistory}
          series={series}
          flashes={flashes}
          active={symbol}
          onSelect={setSymbol}
          formatPrice={formatBDT}
        />

        {/* ─── Prediction Form ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
          <div className="card card-p" style={{ width: '100%' }}>
            {/* Selected coin + live price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className={`coin-icon coin-${symbol}`}>{selectedMeta.glyph}</div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                  {symbol} <span style={{ fontWeight: 500, color: 'var(--color-muted)' }}>{selectedMeta.name}</span>
                </p>
                <p style={{ fontSize: 13, margin: '2px 0 0' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', fontWeight: 600 }}>
                    {formatBDT(currentPriceBDT)}
                  </span>
                  {selectedCoin?.percentChange24h !== null && selectedCoin?.percentChange24h !== undefined && (
                    <span
                      className={selectedCoin.percentChange24h >= 0 ? 'text-up' : 'text-down'}
                      style={{ marginLeft: 8, fontWeight: 600 }}
                    >
                      {selectedCoin.percentChange24h >= 0 ? '+' : ''}{selectedCoin.percentChange24h.toFixed(2)}%
                    </span>
                  )}
                </p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 8 }}>
              Pick a different coin from the watchlist on the left.
            </p>

            {/* Duration presets */}
            <div style={{ marginTop: 16 }}>
              <span className="cs-label">Closes in</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.minutes}
                    type="button"
                    id={`duration-${preset.minutes}`}
                    onClick={() => setDurationMinutes(preset.minutes)}
                    style={{
                      padding: '8px 0',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${durationMinutes === preset.minutes ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      backgroundColor: durationMinutes === preset.minutes ? 'rgba(252,213,53,0.12)' : 'var(--color-canvas)',
                      color: durationMinutes === preset.minutes ? 'var(--color-on-primary-text, #92700a)' : 'var(--color-body)',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <PredictionMarket
            outcomes={PREDICTION_OUTCOMES}
            value={{ mode, outcomeId: direction, amount: pointsStaked }}
            onValueChange={(next) => {
              setMode(next.mode);
              setDirection(next.outcomeId);
              setPointsStaked(next.amount);
            }}
            onTrade={handleTrade}
            balance={availablePoints}
            positions={{ up: 0, down: 0 }}
            quickAmounts={[10, 50, 100, 500]}
            minTrade={1}
            orderTypeLabel={selectedPreset.label}
            className="max-w-none"
          />
        </div>

        {/* ─── Info Card ─── */}
        <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
          <div>
            <h3 className="section-title">How it works</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
              {[
                {
                  step: '1',
                  title: 'Set up your call',
                  text: 'Pick a coin from the watchlist, choose Up or Down, a close window (15 sec to 24 hours), and how many points to stake.',
                },
                {
                  step: '2',
                  title: 'The clock runs',
                  text: isReal
                    ? "Your stake is locked in immediately. The prediction is judged against your own live price feed, sampled the instant the window closes."
                    : "Your stake is locked in immediately. The prediction is judged against your own simulated price feed, sampled the instant the window closes.",
                },
                {
                  step: '3',
                  title: 'Win or lose',
                  text: 'Called it right? Your stake doubles and lands in your wallet instantly. Wrong call? The stake is forfeited — no partial refunds.',
                },
              ].map(({ step, title, text }) => (
                <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-on-primary)',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {step}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>{title}</p>
                    <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: '2px 0 0', lineHeight: 1.5 }}>
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: 16 }}>
            <span className="cs-label">Example payout</span>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <div style={{ flex: 1, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-hairline)', padding: '10px 12px' }}>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>Stake</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', margin: '2px 0 0' }}>
                  100 pts
                </p>
              </div>
              <div style={{ flex: 1, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-up-bg)', padding: '10px 12px' }}>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>Correct call</p>
                <p className="text-up" style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', margin: '2px 0 0' }}>
                  +100 pts
                </p>
              </div>
              <div style={{ flex: 1, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-down-bg)', padding: '10px 12px' }}>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>Wrong call</p>
                <p className="text-down" style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', margin: '2px 0 0' }}>
                  -100 pts
                </p>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '10px 0 0', lineHeight: 1.5 }}>
              Every trade pays out at a fixed 2.00× multiplier — win and you walk away with 200 pts, double what you put in.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: 16 }}>
            <span className="cs-label">Good to know</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {[
                'Once confirmed, a prediction can\'t be cancelled or adjusted before its close time.',
                'Shorter windows (15 sec, 5 min) move fast and swing more — longer windows smooth out the noise.',
                'Your price feed is personal to your account, separate from the public Market page ticker.',
                'Settled predictions — wins and losses alike — appear instantly in Your Predictions below.',
              ].map((text) => (
                <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary)',
                      marginTop: 7,
                      flexShrink: 0,
                    }}
                  />
                  <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0, lineHeight: 1.5 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Prediction History ─── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)' }}>
          <p className="section-title">Your Predictions</p>
        </div>

        {isLoadingHistory ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <span className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : !historyPage || historyPage.predictions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p className="text-muted" style={{ fontSize: 14 }}>No predictions yet.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="cs-table">
                <thead>
                  <tr>
                    <th>Coin</th>
                    <th>Direction</th>
                    <th className="text-right">Staked</th>
                    <th className="text-right">Start Price</th>
                    <th className="text-right">End Price</th>
                    <th>Closes</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {historyPage.predictions.map((prediction) => (
                    <tr key={prediction._id}>
                      <td className="font-medium">{prediction.symbol}</td>
                      <td>
                        <span
                          className={prediction.direction === 'up' ? 'text-up' : 'text-down'}
                          style={{ fontWeight: 600 }}
                        >
                          {prediction.direction === 'up' ? '▲ Up' : '▼ Down'}
                        </span>
                      </td>
                      <td className="text-right num">{prediction.pointsStaked} pts</td>
                      <td className="text-right num">{formatBDT(prediction.startPriceBDT)}</td>
                      <td className="text-right num">{formatBDT(prediction.endPriceBDT)}</td>
                      <td style={{ fontSize: 12, color: 'var(--color-muted)' }}>{formatDate(prediction.closesAt)}</td>
                      <td><ResultBadge result={prediction.result} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span className="pagination-info">
                Page {historyPage.page} of {historyPage.totalPages}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setHistoryPageNumber((p) => Math.max(1, p - 1))}
                  disabled={historyPage.page <= 1}
                  className="btn btn-secondary btn-sm"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryPageNumber((p) => Math.min(historyPage.totalPages, p + 1))}
                  disabled={historyPage.page >= historyPage.totalPages}
                  className="btn btn-secondary btn-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
