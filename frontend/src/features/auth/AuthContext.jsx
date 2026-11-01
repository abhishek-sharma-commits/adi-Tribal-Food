import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready'

  useEffect(() => {
    let active = true;
    api
      .get('/auth/me')
      .then((res) => active && setUser(res.data.user))
      .catch(() => active && setUser(null))
      .finally(() => active && setStatus('ready'));
    return () => {
      active = false;
    };
  }, []);

  // The API client fires this when a protected call returns 401 (session expired or account suspended).
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (details) => {
    const res = await api.post('/auth/register', details);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (values) => {
    const res = await api.patch('/auth/me', values);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const changePassword = useCallback(async (values) => {
    await api.patch('/auth/password', values);
  }, []);

  const value = useMemo(
    () => ({ user, status, isAdmin: user?.role === 'admin', login, register, logout, updateProfile, changePassword }),
    [user, status, login, register, logout, updateProfile, changePassword]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
