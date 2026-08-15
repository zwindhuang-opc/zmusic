import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  register as svcRegister,
  login as svcLogin,
  logout as svcLogout,
  getActiveUser as svcGetActiveUser,
  updateProfile as svcUpdateProfile,
} from '../services/auth.service.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const active = svcGetActiveUser();
      if (active) setUser(active);
    } catch (e) {
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await svcLogin(credentials);
    if (result) setUser(result);
    return result;
  }, []);

  const logout = useCallback(() => {
    svcLogout();
    setUser(null);
    return true;
  }, []);

  const register = useCallback(async (data) => {
    const result = await svcRegister(data);
    if (result) setUser(result);
    return result;
  }, []);

  const updateProfile = useCallback((userId, partial) => {
    const result = svcUpdateProfile(userId, partial);
    if (result && typeof result.then !== 'function') {
      if (user && user.id === result.id) setUser(result);
      return result;
    }
    return Promise.resolve(result).then(r => {
      if (r && user && user.id === r.id) setUser(r);
      return r;
    });
  }, [user]);

  const value = { user, login, logout, register, updateProfile, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthProvider;
