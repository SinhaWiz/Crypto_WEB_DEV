import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { httpClient } from '../../services/httpClient';
import { socket, connectSocket, disconnectSocket } from '../../services/socketClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    try {
      const userRes = await httpClient.get('/api/auth/me');
      setUser(userRes.user);
      setMode(userRes.mode ?? null);

      if (userRes.user) {
        const walletRes = await httpClient.get('/api/wallet');
        setWallet(walletRes.wallet);
        connectSocket();
      }
    } catch (err) {
      setUser(null);
      setWallet(null);
      setMode(null);
      disconnectSocket();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    const handleWalletUpdate = () => {
      fetchUserData();
    };

    socket.on('wallet:update', handleWalletUpdate);

    return () => {
      socket.off('wallet:update', handleWalletUpdate);
    };
  }, [fetchUserData]);

  const login = async (credentials) => {
    const res = await httpClient.post('/api/auth/login', credentials);
    setUser(res.user);
    setWallet(res.wallet);
    setMode(res.mode ?? null);
    connectSocket();
    return res;
  };

  const register = async (data) => {
    const res = await httpClient.post('/api/auth/register', data);
    setUser(res.user);
    setWallet(res.wallet);
    setMode(res.mode ?? null);
    connectSocket();
    return res;
  };

  const logout = async () => {
    try {
      await httpClient.post('/api/auth/logout');
    } catch {
      // Even if the request fails, clear local state
    } finally {
      setUser(null);
      setWallet(null);
      setMode(null);
      disconnectSocket();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        mode,
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
