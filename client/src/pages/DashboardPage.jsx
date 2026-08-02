import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth.js';
import { getWallet } from '../services/walletService.js';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    getWallet()
      .then((data) => {
        if (!cancelled) setWallet(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load wallet');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Welcome, {user?.name}</h1>
        <button type="button" onClick={logout}>
          Log out
        </button>
      </header>

      {error && <p className="form-error">{error}</p>}

      {wallet ? (
        <div className="wallet-summary">
          <p className="wallet-balance">{wallet.cashBalanceBDT.toLocaleString()} BDT</p>
          <p>Virtual points: {wallet.virtualPoints}</p>
        </div>
      ) : (
        !error && <p>Loading wallet...</p>
      )}

      <p>
        <Link to="/market">View market</Link>
      </p>
    </div>
  );
}
