import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { httpClient } from '../../services/httpClient';
import { connectSocket, disconnectSocket } from '../../services/socketClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    try {
      const [userRes, walletRes] = await Promise.all([
        httpClient.get('/api/auth/me'),
        httpClient.get('/api/wallet'),
      ]);
      setUser(userRes.user);
      setWallet(walletRes.wallet);
      connectSocket();
    } catch (err) {
      setUser(null);
      setWallet(null);
      disconnectSocket();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const login = async (credentials) => {
    const res = await httpClient.post('/api/auth/login', credentials);
    setUser(res.user);
    await fetchUserData(); // Fetch wallet after login
    return res;
  };

  const register = async (data) => {
    const res = await httpClient.post('/api/auth/register', data);
    setUser(res.user);
    await fetchUserData();
    return res;
  };

  const logout = async () => {
    // Optionally call a logout endpoint if it existed, otherwise just clear state 
    // (JWT cookie clearing usually handled by server, but we can't easily clear httpOnly cookie from client)
    // For now we'll just reset state. If we add /api/auth/logout later we call it here.
    setUser(null);
    setWallet(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        loading,
        login,
        register,
        logout,
        refreshWallet: fetchUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
