import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { COIN_META } from '../lib/coinMeta';
import { SUPPORTED_SYMBOLS } from '../lib/constants';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { getMarketEvents, triggerMarketEvent, getMarketEventLog } from '../services/eventsService';

const LOG_POLL_MS = 6000;

function formatBDT(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `৳${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatRelativeTime(value) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

function EventIcon({ symbols }) {
  if (symbols.length === 1) {
    const meta = COIN_META[symbols[0]] ?? { glyph: symbols[0][0] };
    return <div className={`coin-icon coin-${symbols[0]}`}>{meta.glyph}</div>;
  }
  return (
    <div
      className="coin-icon"
      style={{ backgroundColor: 'rgba(252,213,53,0.12)', color: 'var(--color-primary)', fontSize: 13 }}
    >
      ALL
    </div>
  );
}

export function EventsPage() {
  const { mode, wallet, refreshWallet } = useAuth();
  const isSimulated = mode === 'simulated';

  const [events, setEvents] = useState([]);
  const [log, setLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [triggeringCode, setTriggeringCode] = useState(null);
  const [result, setResult] = useState(null);
  const pollRef = useRef(null);

  const { prices: livePrices, flashes } = useMarketPrices(isSimulated ? SUPPORTED_SYMBOLS : []);

  const loadEvents = useCallback(() => {
    if (!isSimulated) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    getMarketEvents()
      .then(setEvents)
      .catch(() => setError('Could not load market events'))
      .finally(() => setIsLoading(false));
  }, [isSimulated]);

  const loadLog = useCallback(() => {
    if (!isSimulated) return;
    getMarketEventLog().then(setLog).catch(() => {});
  }, [isSimulated]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    loadLog();
    if (!isSimulated) return undefined;
    pollRef.current = setInterval(loadLog, LOG_POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [isSimulated, loadLog]);

  const handleTrigger = useCallback(async (code) => {
    setTriggeringCode(code);
    setResult(null);
    try {
      const { event } = await triggerMarketEvent(code);
      setResult({ type: 'success', message: `${event.title} triggered — ${event.symbols.join(', ')} moved ${event.impactPercent >= 0 ? '+' : ''}${event.impactPercent}%.` });
      await refreshWallet();
      loadLog();
    } catch (err) {
      setResult({ type: 'error', message: err.message || 'Could not trigger this event' });
    } finally {
      setTriggeringCode(null);
    }
  }, [refreshWallet, loadLog]);

  if (!isSimulated) {
    return (
      <div className="page-stack">
        <div>
          <h1 className="page-title">Market Events</h1>
          <p className="page-subtitle">Trigger news-driven price shocks on your own simulated feed.</p>
        </div>
        <div className="card card-p" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: 0 }}>
            Market Events are only available in Simulated mode — your account is set to Real Market Data,
            which always tracks CoinGecko's actual prices.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
        <span className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="msg-error" style={{ marginBottom: 12 }}>{error}</div>
        <button onClick={loadEvents} className="btn btn-secondary btn-sm">Try again</button>
      </div>
    );
  }

  return (
    <div className="page-stack">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Market Events</h1>
          <p className="page-subtitle">
            Pay points to trigger a news event on your own feed — or wait, they occasionally fire on their own.
          </p>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0 }}>
          Balance:{' '}
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', fontWeight: 600 }}>
            {wallet?.virtualPoints ?? 0} pts
          </span>
        </p>
      </div>

      {result && (
        <div className={result.type === 'success' ? 'msg-success' : 'msg-error'}>{result.message}</div>
      )}

      {/* ─── Live Prices — watch this move the instant an event fires ─── */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0,
          overflow: 'hidden',
        }}
      >
        {livePrices.map((coin) => {
          const meta = COIN_META[coin.symbol] ?? { glyph: coin.symbol[0], name: coin.symbol };
          const flash = flashes[coin.symbol];
          return (
            <div
              key={coin.symbol}
              id={`live-price-${coin.symbol}`}
              className={flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                flex: '1 1 180px',
                borderRight: '1px solid var(--color-hairline)',
                transition: 'background-color 150ms ease',
              }}
            >
              <div className={`coin-icon coin-icon-sm coin-${coin.symbol}`}>{meta.glyph}</div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>{coin.symbol}</p>
                <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', margin: 0 }}>
                  {formatBDT(coin.priceBDT)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Event Catalog ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {events.map((event) => {
          const positive = event.impactPercent >= 0;
          const affordable = (wallet?.virtualPoints ?? 0) >= event.costPoints;
          const singleSymbol = event.symbols.length === 1 && event.symbols[0] !== 'ALL' ? event.symbols[0] : null;

          return (
            <div key={event.code} id={`event-${event.code}`} className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <EventIcon symbols={event.symbols} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>{event.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
                    {event.description}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={positive ? 'text-up' : 'text-down'} style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {positive ? '+' : ''}{event.impactPercent}%
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  {event.symbols.includes('ALL') ? 'All coins' : event.symbols.join(', ')}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <button
                  type="button"
                  id={`trigger-${event.code}`}
                  className="btn btn-primary btn-sm"
                  disabled={!affordable || triggeringCode !== null}
                  onClick={() => handleTrigger(event.code)}
                  style={{ flex: 1 }}
                >
                  {triggeringCode === event.code ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <span className="spinner" style={{ width: 14, height: 14 }} />
                      Triggering…
                    </span>
                  ) : (
                    `Trigger — ${event.costPoints} pts`
                  )}
                </button>
              </div>

              {!affordable && (
                <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>
                  Not enough points — earn more from predictions or buy points in your Wallet.
                </p>
              )}

              {singleSymbol && (
                <Link to={`/market/${singleSymbol}`} style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Trade {singleSymbol} →
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Recent Events Feed ─── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)' }}>
          <p className="section-title">Recent Events</p>
        </div>
        {log.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <p className="text-muted" style={{ fontSize: 14 }}>No events yet — trigger one above, or wait for one to happen on its own.</p>
          </div>
        ) : (
          <div>
            {log.map((entry) => {
              const positive = entry.impactPercent >= 0;
              return (
                <div
                  key={entry._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--color-hairline)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span
                      className="badge"
                      style={{
                        fontSize: 10,
                        backgroundColor: entry.source === 'user' ? 'rgba(252,213,53,0.12)' : 'rgba(59,130,246,0.12)',
                        color: entry.source === 'user' ? 'var(--color-primary)' : 'var(--color-info)',
                      }}
                    >
                      {entry.source === 'user' ? 'You' : 'Ambient'}
                    </span>
                    <p style={{ fontSize: 13, color: 'var(--color-ink)', margin: 0, fontWeight: 600 }}>{entry.title}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span className={positive ? 'text-up' : 'text-down'} style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {positive ? '+' : ''}{entry.impactPercent}%
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{formatRelativeTime(entry.triggeredAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
