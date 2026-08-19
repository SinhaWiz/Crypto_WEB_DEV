import { useState } from 'react';
import { DISCLAIMER_TEXT } from '../lib/constants';

export function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('cs-disclaimer-dismissed') === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('cs-disclaimer-dismissed', '1');
    } catch {
      // ignore
    }
  };

  return (
    <div className="disclaimer-banner" role="alert" aria-live="polite">
      <span>⚠ {DISCLAIMER_TEXT}</span>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss disclaimer"
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          color: 'inherit',
          opacity: 0.6,
          padding: '2px 4px',
        }}
      >
        ×
      </button>
    </div>
  );
}
