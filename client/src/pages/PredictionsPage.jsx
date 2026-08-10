import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SUPPORTED_SYMBOLS } from '../lib/constants';
import { createPrediction, getPredictionHistory } from '../services/gamificationService';

export function PredictionsPage() {
  const [symbol, setSymbol] = useState(SUPPORTED_SYMBOLS[0]);
  const [direction, setDirection] = useState('up');
  const [pointsStaked, setPointsStaked] = useState('10');
  const [durationMinutes, setDurationMinutes] = useState('5');
  const [predictions, setPredictions] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refreshHistory() {
    const history = await getPredictionHistory();
    setPredictions(history);
  }

  useEffect(() => {
    refreshHistory()
      .catch(() => setError('Could not load predictions'))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      await createPrediction({
        symbol,
        direction,
        pointsStaked: Number(pointsStaked),
        durationMinutes: Number(durationMinutes),
      });
      setMessage('Prediction opened');
      await refreshHistory();
    } catch (err) {
      setError(err.response?.data?.error?.message ?? 'Could not open prediction');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="portfolio-page">
      <header className="dashboard-header">
        <h1>Predictions</h1>
        <Link to="/">Back to dashboard</Link>
      </header>

      <form className="trade-panel" onSubmit={handleSubmit}>
        <div className="trade-panel-header">
          <h2>Open Challenge</h2>
          <div className="segmented-control" aria-label="Direction">
            <button type="button" className={direction === 'up' ? 'active' : ''} onClick={() => setDirection('up')}>
              Up
            </button>
            <button
              type="button"
              className={direction === 'down' ? 'active' : ''}
              onClick={() => setDirection('down')}
            >
              Down
            </button>
          </div>
        </div>
        <label>
          Coin
          <select value={symbol} onChange={(event) => setSymbol(event.target.value)}>
            {SUPPORTED_SYMBOLS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Points
          <input value={pointsStaked} min="1" type="number" onChange={(event) => setPointsStaked(event.target.value)} />
        </label>
        <label>
          Minutes
          <input
            value={durationMinutes}
            min="1"
            max="1440"
            type="number"
            onChange={(event) => setDurationMinutes(event.target.value)}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Opening...' : 'Open prediction'}
        </button>
      </form>

      <section className="data-section">
        <h2>History</h2>
        {isLoading && <p>Loading predictions...</p>}
        {!isLoading && predictions.length === 0 && <p>No predictions yet.</p>}
        {predictions.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Direction</th>
                  <th>Stake</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((prediction) => (
                  <tr key={prediction._id}>
                    <td>{prediction.symbol}</td>
                    <td>{prediction.direction}</td>
                    <td>{prediction.pointsStaked}</td>
                    <td>{prediction.startPriceBDT.toLocaleString()}</td>
                    <td>{prediction.endPriceBDT?.toLocaleString() ?? 'Pending'}</td>
                    <td>{prediction.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
