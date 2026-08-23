import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COIN_META } from '@/lib/coinMeta';

function Sparkline({ points, positive }) {
  const values = points.map((p) => p.priceBDT);
  const hasTrend = values.length > 1;

  if (!hasTrend) {
    return (
      <svg viewBox="0 0 96 32" className="h-8 w-24 shrink-0" aria-hidden="true">
        <line x1="2" y1="16" x2="94" y2="16" stroke="var(--color-hairline)" strokeWidth="1.6" strokeDasharray="2 3" />
      </svg>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const pad = (max - min) * 0.12 || max * 0.001 || 1;
  const lo = min - pad;
  const hi = max + pad;

  const coords = values.map((value, index) => ({
    x: 2 + (index / (values.length - 1)) * 92,
    y: 4 + (1 - (value - lo) / (hi - lo || 1)) * 24,
  }));

  const linePath = coords
    .map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(2)} 30 L${coords[0].x.toFixed(2)} 30 Z`;
  const stroke = positive ? 'var(--color-up)' : 'var(--color-down)';
  const last = coords[coords.length - 1];

  return (
    <svg viewBox="0 0 96 32" className="h-8 w-24 shrink-0" aria-hidden="true">
      <path d={areaPath} fill={stroke} opacity="0.12" stroke="none" />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="1.8" fill={stroke} />
    </svg>
  );
}

export function MarketWatchlist({
  coins = [],
  history = {},
  series = {},
  flashes = {},
  active,
  onSelect,
  formatPrice = (v) => v,
}) {
  const [sortKey, setSortKey] = useState('change');
  const [descending, setDescending] = useState(true);

  const rows = useMemo(() => {
    const list = [...coins];
    list.sort((a, b) => {
      const result =
        sortKey === 'change'
          ? (a.percentChange24h ?? 0) - (b.percentChange24h ?? 0)
          : a.symbol.localeCompare(b.symbol);
      return descending ? -result : result;
    });
    return list;
  }, [coins, sortKey, descending]);

  const changeSort = (next) => {
    if (sortKey === next) {
      setDescending((v) => !v);
    } else {
      setSortKey(next);
      setDescending(next === 'change');
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Market Watchlist</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Tap a coin to predict on it</p>
        </div>
        <span className="badge badge-live text-[11px]">● Live</span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_96px_84px] items-center gap-2 border-b border-border px-5 py-2">
        <button
          type="button"
          onClick={() => changeSort('symbol')}
          className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
        >
          Coin {sortKey === 'symbol' && (descending ? <ChevronDown size={11} /> : <ChevronUp size={11} />)}
        </button>
        <span className="text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Trend
        </span>
        <button
          type="button"
          onClick={() => changeSort('change')}
          className="flex items-center justify-end gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
        >
          Change {sortKey === 'change' && (descending ? <ChevronDown size={11} /> : <ChevronUp size={11} />)}
        </button>
      </div>

      <div className="flex-1">
        {rows.map((coin) => {
          const meta = COIN_META[coin.symbol] ?? { glyph: coin.symbol[0], name: coin.symbol };
          const positive = (coin.percentChange24h ?? 0) >= 0;
          const selected = active === coin.symbol;
          const flash = flashes[coin.symbol];
          const historicalPoints = (history[coin.symbol] ?? []).map((candle) => ({ priceBDT: candle.close }));
          const points = [...historicalPoints, ...(series[coin.symbol] ?? [])];

          return (
            <button
              key={coin.symbol}
              type="button"
              id={`watchlist-row-${coin.symbol}`}
              onClick={() => onSelect?.(coin.symbol)}
              className={cn(
                'grid w-full grid-cols-[minmax(0,1fr)_96px_84px] items-center gap-2 border-b border-border/60 px-5 py-3 text-left transition-colors last:border-b-0 hover:bg-primary/5',
                flash === 'up' && 'flash-up',
                flash === 'down' && 'flash-down',
              )}
              style={
                selected
                  ? { backgroundColor: 'rgba(252,213,53,0.08)', boxShadow: 'inset 3px 0 0 var(--color-primary)' }
                  : undefined
              }
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className={`coin-icon coin-icon-sm coin-${coin.symbol}`}>{meta.glyph}</span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-foreground">{coin.symbol}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{meta.name}</span>
                </span>
              </span>

              <span className="flex justify-center">
                <Sparkline points={points} positive={positive} />
              </span>

              <span className="text-right tabular-nums">
                <span className="block font-mono text-[12px] font-semibold text-foreground">
                  {formatPrice(coin.priceBDT)}
                </span>
                <span className={cn('text-[11px] font-semibold', positive ? 'text-up' : 'text-down')}>
                  {coin.percentChange24h !== null && coin.percentChange24h !== undefined
                    ? `${positive ? '+' : ''}${coin.percentChange24h.toFixed(2)}%`
                    : '—'}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
