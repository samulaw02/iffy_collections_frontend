import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ic_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ic_token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => { localStorage.removeItem('ic_token'); localStorage.removeItem('ic_user'); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('ic_token', res.data.token);
    localStorage.setItem('ic_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('ic_token');
    localStorage.removeItem('ic_user');
    setUser(null);
  };

  const updateUser = (patch) => {
    setUser(prev => {
      const updated = { ...prev, ...patch };
      localStorage.setItem('ic_user', JSON.stringify(updated));
      return updated;
    });
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isSalesRep = user?.role === 'sales_rep';
  const canManageStock = isAdmin;
  const canManageUsers = isAdmin;
  const canEditProducts = isAdmin;
  const canAddProducts = isAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAdmin, isManager, isSalesRep, canManageStock, canManageUsers, canEditProducts, canAddProducts }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
