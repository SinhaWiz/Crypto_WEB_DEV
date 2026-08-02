import { DISCLAIMER_TEXT } from '../lib/constants';

export function DisclaimerBanner() {
  return (
    <div className="disclaimer-banner" role="note">
      {DISCLAIMER_TEXT}
    </div>
  );
}
