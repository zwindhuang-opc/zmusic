import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const AUTH_TOKEN_KEY = 'zmusic_auth_token';

// ------ Low-level token storage (shared by everyone) ------
function saveToken(token) {
  try { localStorage.setItem(AUTH_TOKEN_KEY, token || ''); } catch (_) {}
}
function readToken() {
  try { return localStorage.getItem(AUTH_TOKEN_KEY) || ''; } catch (_) { return ''; }
}
function clearToken() {
  try { localStorage.removeItem(AUTH_TOKEN_KEY); } catch (_) {}
}

// ------ Light API helpers (no import of api.client to avoid circular deps) ------
function apiBase() {
  return import.meta.env?.VITE_API_BASE_URL || '';
}
async function apiGet(path) {
  const token = readToken();
  const r = await fetch(`${apiBase()}/api${path}`, {
    method: 'GET',
    credentials: 'same-origin',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return await r.json().catch(() => ({}));
}
async function apiPost(path, body) {
  const token = readToken();
  const r = await fetch(`${apiBase()}/api${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok && data.success === true, status: r.status, data };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [smsProvider, setSmsProvider] = useState('dev');

  /**
   * Validate the stored token against the backend /api/auth/me endpoint.
   * If the token is valid, populate user state; otherwise clear it.
   */
  const restoreSession = useCallback(async () => {
    const token = readToken();
    if (!token) { setLoading(false); return null; }
    try {
      const data = await apiGet('/auth/me');
      if (data?.success && data?.user) {
        setUser(data.user);
        if (data?.smsProvider) setSmsProvider(data.smsProvider);
        setLoading(false);
        return data.user;
      }
    } catch (_) { /* backend unreachable — leave user as-is, stop loading */ }
    clearToken();
    setUser(null);
    setLoading(false);
    return null;
  }, []);

  // On mount: validate any persisted token against the server
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // ------ Server-side login (supports email+pwd and phone+sms/pwd) ------
  const login = useCallback(async (credentials) => {
    const res = await apiPost('/auth/login', credentials || {});
    if (!res.ok) {
      throw new Error(res.data?.message_en || res.data?.error || 'Login failed');
    }
    const { user: u, token } = res.data;
    if (token) saveToken(token);
    setUser(u || null);
    return u;
  }, []);

  // ------ Server-side register (email or phone+SMS) ------
  const register = useCallback(async (data) => {
    const res = await apiPost('/auth/register', data || {});
    if (!res.ok) {
      throw new Error(res.data?.message_en || res.data?.error || 'Registration failed');
    }
    const { user: u, token } = res.data;
    if (token) saveToken(token);
    setUser(u || null);
    return u;
  }, []);

  // ------ Logout: server-side destroy + clear local state ------
  const logout = useCallback(() => {
    const token = readToken();
    // Fire-and-forget server-side logout (best-effort)
    fetch(`${apiBase()}/api/auth/logout`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {});
    clearToken();
    setUser(null);
    return true;
  }, []);

  // ------ Password reset via phone + SMS ------
  const resetPassword = useCallback(async ({ phone, smsCode, oneTimeToken, newPassword }) => {
    const res = await apiPost('/auth/password/reset', { phone, smsCode, oneTimeToken, newPassword });
    if (!res.ok) {
      throw new Error(res.data?.message_en || res.data?.error || 'Reset failed');
    }
    return true;
  }, []);

  // ------ Password change (requires login) ------
  const changePassword = useCallback(async ({ oldPassword, newPassword }) => {
    const res = await apiPost('/auth/password/change', { oldPassword, newPassword });
    if (!res.ok) {
      throw new Error(res.data?.message_en || res.data?.error || 'Change failed');
    }
    if (res.data?.user) setUser(res.data.user);
    return true;
  }, []);

  // ------ Send SMS code (register / login / reset) ------
  const sendSmsCode = useCallback(async ({ phone, purpose = 'register', lang = 'en' }) => {
    const res = await apiPost('/auth/sms/send', { phone, purpose, lang });
    if (!res.ok) {
      throw new Error(res.data?.message_en || res.data?.error || 'SMS send failed');
    }
    return res.data; // { success, provider, devCode?, expiresInSeconds }
  }, []);

  // ------ Verify SMS code (returns oneTimeToken for register/login completion) ------
  const verifySmsCode = useCallback(async ({ phone, purpose = 'register', code }) => {
    const res = await apiPost('/auth/sms/verify', { phone, purpose, code });
    if (!res.ok) {
      throw new Error(res.data?.message_en || res.data?.error || 'SMS verify failed');
    }
    return res.data; // { success, oneTimeToken, phone }
  }, []);

  // ------ Update profile (local optimistic + reload via /me) ------
  const updateProfile = useCallback(async (userId, partial) => {
    // Re-validate the session to refresh the user object
    const u = await restoreSession();
    return u || user;
  }, [restoreSession, user]);

  const value = {
    user,
    loading,
    smsProvider,
    login,
    logout,
    register,
    updateProfile,
    resetPassword,
    changePassword,
    sendSmsCode,
    verifySmsCode,
    restoreSession,
    setUser,
  };

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
