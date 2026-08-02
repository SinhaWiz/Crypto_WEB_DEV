import { useCallback, useEffect, useState } from 'react';
import { httpClient } from '../../services/httpClient';
import { AuthContext } from './context.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const { data } = await httpClient.get('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const register = useCallback(async ({ name, email, password }) => {
    const { data } = await httpClient.post('/auth/register', { name, email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { data } = await httpClient.post('/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await httpClient.post('/auth/logout');
    setUser(null);
  }, []);

  const value = { user, isLoading, register, login, logout, refresh: loadMe };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
