import { Outlet } from 'react-router-dom';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export function RootLayout() {
  return (
    <div className="app-shell">
      <DisclaimerBanner />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
