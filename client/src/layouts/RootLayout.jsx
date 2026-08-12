import { Outlet, Link } from 'react-router-dom';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { useAuth } from '../features/auth/AuthContext';

export function RootLayout() {
  const { user, wallet, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900 font-sans">
      <DisclaimerBanner />
      
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="font-bold text-xl text-purple-600 tracking-tight">CryptoSim</span>
              </Link>
              <div className="ml-10 flex space-x-4">
                <Link to="/market" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Market
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="text-sm">
                    <span className="text-gray-500 mr-2">Balance:</span>
                    <span className="font-semibold text-gray-900">
                      {wallet ? `৳${wallet.balance.toLocaleString()}` : '...'}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-gray-300"></div>
                  <div className="text-sm font-medium text-gray-700">
                    {user.name}
                  </div>
                  <button
                    onClick={logout}
                    className="ml-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
