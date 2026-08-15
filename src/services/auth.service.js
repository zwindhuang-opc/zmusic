const USERS_KEY = 'zmusic_users';

function readStorage() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return { users: [], activeUserId: null };
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      activeUserId: parsed.activeUserId || null,
    };
  } catch (e) {
    return { users: [], activeUserId: null };
  }
}

function writeStorage(data) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

async function sha256(password) {
  if (typeof password !== 'string') password = String(password || '');
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const enc = new TextEncoder();
      const buf = await window.crypto.subtle.digest('SHA-256', enc.encode(password));
      const arr = Array.from(new Uint8Array(buf));
      return arr.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
  }
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  try {
    return btoa(`${password.length}|${hash}|${password.slice(0, 4)}`).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  } catch (e2) {
    return `weak_${Math.abs(hash)}_${password.length}`;
  }
}

export async function register({ username, email, password }) {
  if (!email || !password) throw new Error('Email and password required');
  const store = readStorage();
  email = String(email).trim().toLowerCase();
  if (store.users.some(u => u.email === email)) {
    throw new Error('Email already registered');
  }
  const passwordHash = await sha256(password);
  const user = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    username: String(username || email.split('@')[0] || 'User').trim(),
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
    avatar: null,
    settings: {},
  };
  store.users.push(user);
  writeStorage(store);
  const { passwordHash: _ph, ...safe } = user;
  return safe;
}

export async function login({ email, password }) {
  if (!email || !password) return null;
  const store = readStorage();
  email = String(email).trim().toLowerCase();
  const user = store.users.find(u => u.email === email);
  if (!user) return null;
  const inputHash = await sha256(password);
  if (inputHash !== user.passwordHash) return null;
  store.activeUserId = user.id;
  writeStorage(store);
  const { passwordHash: _ph, ...safe } = user;
  return safe;
}

export function logout() {
  const store = readStorage();
  store.activeUserId = null;
  writeStorage(store);
  return true;
}

export function getActiveUser() {
  const store = readStorage();
  if (!store.activeUserId) return null;
  const user = store.users.find(u => u.id === store.activeUserId);
  if (!user) return null;
  const { passwordHash: _ph, ...safe } = user;
  return safe;
}

export function updateProfile(userId, partial) {
  if (!userId) return null;
  const store = readStorage();
  const idx = store.users.findIndex(u => u.id === userId);
  if (idx === -1) return null;
  const updated = { ...store.users[idx], ...partial, updatedAt: new Date().toISOString() };
  if (partial.password) {
    return (async () => {
      updated.passwordHash = await sha256(partial.password);
      delete updated.password;
      store.users[idx] = updated;
      writeStorage(store);
      const { passwordHash: _ph, ...safe } = updated;
      return safe;
    })();
  }
  store.users[idx] = updated;
  writeStorage(store);
  const { passwordHash: _ph, ...safe } = updated;
  return safe;
}

export function exportUsers() {
  const store = readStorage();
  return JSON.stringify({
    users: store.users.map(u => {
      const { passwordHash: _ph, ...safe } = u;
      return safe;
    }),
    exportedAt: new Date().toISOString(),
  });
}

export function importUsers(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.users)) throw new Error('Invalid format');
    const store = readStorage();
    const existingEmails = new Set(store.users.map(u => u.email));
    for (const u of parsed.users) {
      if (u.email && !existingEmails.has(u.email.toLowerCase())) {
        store.users.push({
          ...u,
          email: u.email.toLowerCase(),
          passwordHash: u.passwordHash || `imported_${Date.now()}_${Math.random()}`,
        });
        existingEmails.add(u.email.toLowerCase());
      }
    }
    writeStorage(store);
    return true;
  } catch (e) {
    return false;
  }
}

export function getAllUsers() {
  const store = readStorage();
  return store.users.map(u => {
    const { passwordHash: _ph, ...safe } = u;
    return safe;
  });
}

const AuthService = {
  sha256,
  register,
  login,
  logout,
  getActiveUser,
  updateProfile,
  exportUsers,
  importUsers,
  getAllUsers,
};

export default AuthService;
