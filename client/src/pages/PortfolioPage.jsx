import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPortfolio, getTransactions } from '../services/tradesService';

function formatBDT(value) {
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} BDT`;
}

function formatQuantity(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function AllocationChart({ holdings }) {
  const total = holdings.reduce((sum, holding) => sum + holding.marketValueBDT, 0);

  if (total <= 0) {
    return <p>No holdings yet.</p>;
  }

  return (
    <div className="allocation-chart" aria-label="Portfolio allocation">
      <div className="allocation-bar">
        {holdings.map((holding) => (
          <span
            key={holding.symbol}
            style={{ width: `${(holding.marketValueBDT / total) * 100}%` }}
            title={`${holding.symbol} ${((holding.marketValueBDT / total) * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <ul>
        {holdings.map((holding) => (
          <li key={holding.symbol}>
            <span>{holding.symbol}</span>
            <span>{((holding.marketValueBDT / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getPortfolio(), getTransactions({ limit: 50 })])
      .then(([portfolioData, transactionData]) => {
        if (cancelled) return;
        setPortfolio(portfolioData);
        setTransactions(transactionData.items);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load portfolio');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const holdings = useMemo(() => portfolio?.holdings ?? [], [portfolio]);
  const totalPnlBDT = useMemo(
    () => holdings.reduce((sum, holding) => sum + holding.realizedPnlBDT + holding.unrealizedPnlBDT, 0),
    [holdings]
  );

  return (
    <div className="portfolio-page">
      <header className="dashboard-header">
        <h1>Portfolio</h1>
        <Link to="/">Back to dashboard</Link>
      </header>

      {isLoading && <p>Loading portfolio...</p>}
      {error && <p className="form-error">{error}</p>}

      {!isLoading && !error && portfolio && (
        <>
          <section className="portfolio-totals">
            <div>
              <span>Total value</span>
              <strong>{formatBDT(portfolio.totals.totalValueBDT)}</strong>
            </div>
            <div>
              <span>Cash</span>
              <strong>{formatBDT(portfolio.totals.cashBalanceBDT)}</strong>
            </div>
            <div>
              <span>Total P/L</span>
              <strong className={totalPnlBDT >= 0 ? 'positive' : 'negative'}>{formatBDT(totalPnlBDT)}</strong>
            </div>
          </section>

          <AllocationChart holdings={holdings} />

          <section className="data-section">
            <h2>Holdings</h2>
            {holdings.length === 0 ? (
              <p>No simulated coins held yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Coin</th>
                      <th>Qty</th>
                      <th>Avg buy</th>
                      <th>Live price</th>
                      <th>Value</th>
                      <th>P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => {
                      const pnl = holding.realizedPnlBDT + holding.unrealizedPnlBDT;
                      return (
                        <tr key={holding.symbol}>
                          <td>{holding.symbol}</td>
                          <td>{formatQuantity(holding.quantity)}</td>
                          <td>{formatBDT(holding.averageBuyPriceBDT)}</td>
                          <td>{formatBDT(holding.currentPriceBDT)}</td>
                          <td>{formatBDT(holding.marketValueBDT)}</td>
                          <td className={pnl >= 0 ? 'positive' : 'negative'}>{formatBDT(pnl)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="data-section">
            <h2>Transactions</h2>
            {transactions.length === 0 ? (
              <p>No transactions yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Side</th>
                      <th>Coin</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction._id}>
                        <td>{new Date(transaction.createdAt).toLocaleString()}</td>
                        <td>{transaction.side}</td>
                        <td>{transaction.symbol}</td>
                        <td>{formatQuantity(transaction.quantity)}</td>
                        <td>{formatBDT(transaction.executionPriceBDT)}</td>
                        <td>{formatBDT(transaction.feeBDT)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
