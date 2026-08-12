import { DISCLAIMER_TEXT } from '../lib/constants';

export function DisclaimerBanner() {
  return (
    <div className="bg-purple-100 text-purple-900 border-b border-purple-300 py-2 px-4 text-center text-sm font-medium">
      {DISCLAIMER_TEXT}
    </div>
  );
}
