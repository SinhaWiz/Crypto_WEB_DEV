import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate pt-14 px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-20 sm:py-32 lg:py-40 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Learn Crypto Trading <span className="text-purple-600">Without the Risk</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            A safe, educational simulator designed for university students to practice trading, understand market volatility, and learn portfolio management—completely risk-free.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {user ? (
              <Link
                to="/dashboard"
                className="rounded-md bg-purple-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/register"
                className="rounded-md bg-purple-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
              >
                Start Trading for Free
              </Link>
            )}
            <Link to="/market" className="text-sm font-semibold leading-6 text-gray-900 hover:text-purple-600">
              View Live Markets <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-purple-600">Master the Market</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to practice trading
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              We provide a deterministic, simulated environment powered by real historical data so you can test your strategies safely.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                    <span className="text-white text-xl">💰</span>
                  </div>
                  Virtual Balance
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Start with a 100,000 virtual BDT balance. Execute trades and watch your portfolio value grow or shrink based on real-time simulated ticks.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                    <span className="text-white text-xl">📈</span>
                  </div>
                  Live Market Engine
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Our custom simulation engine provides unique, live price ticks for every user based on Geometric Brownian Motion and real anchor prices.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                    <span className="text-white text-xl">🏆</span>
                  </div>
                  Gamification
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Climb the leaderboard, unlock achievements, and make predictions on the next market movement to earn virtual points.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                    <span className="text-white text-xl">🎓</span>
                  </div>
                  100% Educational
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  No real money is ever at risk. This platform is strictly designed to teach the fundamentals of market mechanics.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
