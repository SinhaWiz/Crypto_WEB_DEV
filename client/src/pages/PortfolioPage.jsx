import { useEffect, useState, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getOpenPositions, getPortfolio, getTransactions } from '../services/tradeService';
import { useAuth } from '../features/auth/AuthContext';

const ALLOCATION_COLORS = ['#f0b90b', '#0ecb81', '#f6465d', '#3b82f6', '#9945ff', '#0085c3'];

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

function formatQuantity(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function pnlColor(value) {
  if (!value || value === 0) return 'var(--color-body)';
  return value > 0 ? 'var(--color-up)' : 'var(--color-down)';
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-surface-card)',
      border: '1px solid var(--color-hairline)',
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: 'var(--shadow-elevated)',
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
        {payload[0]?.name}
      </p>
      <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', margin: '4px 0 0' }}>
        {formatBDT(payload[0]?.value)}
      </p>
    </div>
  );
}

export function PortfolioPage() {
  const { mode } = useAuth();
  const isReal = mode === 'real';
  const [portfolio, setPortfolio] = useState(null);
  const [openPositions, setOpenPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactionsPage, setTransactionsPage] = useState(null);
  const [transactionsPageNumber, setTransactionsPageNumber] = useState(1);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  const loadPortfolio = useCallback(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([getPortfolio(), getOpenPositions()])
      .then(([portfolioData, positionsData]) => {
        setPortfolio(portfolioData);
        setOpenPositions(positionsData?.positions ?? []);
      })
      .catch(() => setError('Could not load portfolio'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { loadPortfolio(); }, [loadPortfolio]);

  useEffect(() => {
    setIsLoadingTransactions(true);
    getTransactions({ page: transactionsPageNumber, limit: 10 })
      .then(setTransactionsPage)
      .catch(() => setTransactionsPage(null))
      .finally(() => setIsLoadingTransactions(false));
  }, [transactionsPageNumber]);

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
        <button onClick={loadPortfolio} className="btn btn-secondary btn-sm">Try again</button>
      </div>
    );
  }

  const holdings = portfolio?.holdings ?? [];
  const totalValueBDT = portfolio?.totalValueBDT ?? 0;
  const totalCostBDT = portfolio?.totalCostBDT ?? 0;
  const totalUnrealizedPnlBDT = portfolio?.totalUnrealizedPnlBDT ?? 0;
  const totalUnrealizedPnlPercent = totalCostBDT > 0 ? (totalUnrealizedPnlBDT / totalCostBDT) * 100 : 0;

  return (
    <div className="page-stack">
      {/* Header */}
      <div>
        <h1 className="page-title">Portfolio</h1>
        <p className="page-subtitle">
          {isReal ? 'Your holdings, valued at live market prices.' : 'Your holdings, valued at live simulated prices.'}
        </p>
      </div>

      {/* ─── Summary Stats ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <div className="stat-card">
          <p className="stat-label">Market Value</p>
          <p className="stat-value" style={{ fontSize: 24 }}>{formatBDT(totalValueBDT)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Cost Basis</p>
          <p className="stat-value" style={{ fontSize: 24 }}>{formatBDT(totalCostBDT)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Unrealized P/L</p>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 24,
            fontWeight: 700,
            color: pnlColor(totalUnrealizedPnlBDT),
          }}>
            {formatSignedBDT(totalUnrealizedPnlBDT)}
          </p>
          <p style={{ fontSize: 12, color: pnlColor(totalUnrealizedPnlBDT), fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {formatSignedPercent(totalUnrealizedPnlPercent)}
          </p>
        </div>
      </div>

      {/* ─── Open Positions ─── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <p className="section-title">Open Positions</p>
          <span className="badge badge-live">{openPositions.length} active</span>
        </div>
        {openPositions.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <p className="text-muted" style={{ fontSize: 14 }}>No leveraged positions are open right now.</p>
            <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
              Open a long or short position from a coin page to track it here.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="cs-table">
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Side</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Lev</th>
                  <th className="text-right">Entry</th>
                  <th className="text-right">Current</th>
                  <th className="text-right">Exposure</th>
                  <th className="text-right">Unrealized P/L</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map((position) => (
                  <tr key={position.id}>
                    <td className="font-medium">{position.symbol}</td>
                    <td>
                      <span className={`badge ${position.side === 'long' ? 'badge-up' : 'badge-down'}`}>
                        {position.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right num">{formatQuantity(position.quantity)}</td>
                    <td className="text-right num">{position.leverage}x</td>
                    <td className="text-right num">{formatBDT(position.entryPriceBDT)}</td>
                    <td className="text-right num">{formatBDT(position.currentPriceBDT)}</td>
                    <td className="text-right num font-medium">{formatBDT(position.exposureBDT)}</td>
                    <td className="text-right num" style={{ color: pnlColor(position.unrealizedPnlBDT) }}>
                      {formatSignedBDT(position.unrealizedPnlBDT)}
                      <span style={{ display: 'block', fontSize: 11, opacity: 0.8 }}>
                        {formatSignedPercent(position.unrealizedPnlPercent)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Holdings ─── */}
      {holdings.length === 0 ? (
        <div
          className="card"
          style={{ padding: 48, textAlign: 'center' }}
        >
          <p style={{ color: 'var(--color-muted)', fontSize: 15 }}>
            You don't hold any coins yet.
          </p>
          <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 4 }}>
            Head to the market to place your first trade.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
          {/* Donut Chart */}
          <div className="card card-p">
            <p className="section-title" style={{ marginBottom: 16 }}>Allocation</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={holdings}
                    dataKey="marketValueBDT"
                    nameKey="symbol"
                    innerRadius={56}
                    outerRadius={86}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {holdings.map((holding, index) => (
                      <Cell key={holding.symbol} fill={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {holdings.map((h, i) => (
                <div key={h.symbol} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%',
                      backgroundColor: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>{h.symbol}</span>
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
                    {formatBDT(h.marketValueBDT)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Holdings Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)' }}>
              <p className="section-title">Holdings</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="cs-table">
                <thead>
                  <tr>
                    <th>Coin</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Avg Buy</th>
                    <th className="text-right">Current</th>
                    <th className="text-right">Value</th>
                    <th className="text-right">Unrealized P/L</th>
                    <th className="text-right">Realized P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => (
                    <tr key={holding.symbol}>
                      <td className="font-medium">{holding.symbol}</td>
                      <td className="text-right num">{holding.quantity}</td>
                      <td className="text-right num">{formatBDT(holding.averageBuyPriceBDT)}</td>
                      <td className="text-right num">{formatBDT(holding.currentPriceBDT)}</td>
                      <td className="text-right num font-medium">{formatBDT(holding.marketValueBDT)}</td>
                      <td className="text-right num" style={{ color: pnlColor(holding.unrealizedPnlBDT) }}>
                        {formatSignedBDT(holding.unrealizedPnlBDT)}
                        <span style={{ display: 'block', fontSize: 11, opacity: 0.8 }}>
                          {formatSignedPercent(holding.unrealizedPnlPercent)}
                        </span>
                      </td>
                      <td className="text-right num" style={{ color: pnlColor(holding.realizedPnlBDT) }}>
                        {formatSignedBDT(holding.realizedPnlBDT)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Transaction History ─── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="section-title">Transaction History</p>
        </div>

        {isLoadingTransactions ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <span className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : !transactionsPage || transactionsPage.transactions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p className="text-muted" style={{ fontSize: 14 }}>No transactions yet.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="cs-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Coin</th>
                    <th>Market</th>
                    <th>Side</th>
                    <th className="text-right">Quantity</th>
                    <th className="text-right">Exec. Price</th>
                    <th className="text-right">Fee</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsPage.transactions.map((tx) => {
                    const isPositionTrade = tx.marketType === 'position';
                    const subtotalBDT = tx.executionPriceBDT * tx.quantity;
                    const totalBDT = isPositionTrade
                      ? tx.positionAction === 'open'
                        ? (tx.marginBDT ?? subtotalBDT) + (tx.feeBDT ?? 0)
                        : (tx.marginBDT ?? subtotalBDT) + (tx.pnlBDT ?? 0) - (tx.feeBDT ?? 0)
                      : tx.side === 'buy'
                      ? subtotalBDT + (tx.feeBDT ?? 0)
                      : subtotalBDT - (tx.feeBDT ?? 0);
                    const sideLabel = isPositionTrade
                      ? `${(tx.positionSide ?? '').toUpperCase()} ${(tx.positionAction ?? '').toUpperCase()}`.trim()
                      : tx.side.toUpperCase();
                    return (
                      <tr key={tx._id}>
                        <td style={{ fontSize: 12, color: 'var(--color-muted)' }}>{formatDate(tx.createdAt)}</td>
                        <td className="font-medium">{tx.symbol}</td>
                        <td>
                          <span className={`badge ${isPositionTrade ? 'badge-live' : 'badge-up'}`}>
                            {isPositionTrade ? `POSITION ${tx.leverage ?? ''}x`.trim() : 'SPOT'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${tx.side === 'buy' ? 'badge-up' : 'badge-down'}`}
                          >
                            {sideLabel}
                          </span>
                        </td>
                        <td className="text-right num">{tx.quantity}</td>
                        <td className="text-right num">{formatBDT(tx.executionPriceBDT)}</td>
                        <td className="text-right num">{formatBDT(tx.feeBDT ?? 0)}</td>
                        <td className="text-right num font-medium">{formatBDT(totalBDT)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <span className="pagination-info">
                Page {transactionsPage.page} of {transactionsPage.totalPages}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setTransactionsPageNumber((p) => Math.max(1, p - 1))}
                  disabled={transactionsPage.page <= 1}
                  className="btn btn-secondary btn-sm"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionsPageNumber((p) => Math.min(transactionsPage.totalPages, p + 1))}
                  disabled={transactionsPage.page >= transactionsPage.totalPages}
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
