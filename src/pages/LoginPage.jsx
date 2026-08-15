import React, { useState } from 'react';
import {
  User, Mail, Lock, LogIn, UserPlus, Sparkles, Music2, ArrowRight,
  Eye, EyeOff, ShieldCheck, AlertCircle,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage({ onNavigate }) {
  const { lang } = useTranslation();
  const isZh = lang === 'zh';
  const { login, register } = useAuth();

  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const L = {
    zh: {
      login_tab: '登录',
      register_tab: '注册',
      welcome_back: '欢迎回来，继续创作你的音乐',
      create_account: '创建新账号，开启 AI 音乐之旅',
      email: '邮箱地址',
      username: '用户名',
      password: '密码',
      confirm_password: '确认密码',
      login_btn: '登录',
      register_btn: '注册账号',
      continue_guest: '无需账号继续浏览',
      forgot_pwd: '忘记密码？',
      no_account: '还没有账号？',
      has_account: '已有账号？',
      go_register: '去注册',
      go_login: '去登录',
      email_required: '请输入邮箱',
      password_required: '请输入密码',
      password_mismatch: '两次输入的密码不一致',
      password_min: '密码至少需要 6 位',
      login_success: '登录成功！',
      register_success: '注册成功！',
      login_failed: '邮箱或密码错误',
      register_failed: '注册失败：',
      email_exists: '该邮箱已注册',
      username_required: '请输入用户名',
      secure_note: '🔒 所有密码本地加密存储，永不发送明文',
      or: '或',
    },
    en: {
      login_tab: 'Login',
      register_tab: 'Register',
      welcome_back: 'Welcome back — continue creating your music',
      create_account: 'Create an account to start your AI music journey',
      email: 'Email',
      username: 'Username',
      password: 'Password',
      confirm_password: 'Confirm Password',
      login_btn: 'Sign in',
      register_btn: 'Create account',
      continue_guest: 'Continue without account',
      forgot_pwd: 'Forgot password?',
      no_account: "Don't have an account?",
      has_account: 'Already have an account?',
      go_register: 'Register',
      go_login: 'Login',
      email_required: 'Please enter your email',
      password_required: 'Please enter your password',
      password_mismatch: 'Passwords do not match',
      password_min: 'Password must be at least 6 characters',
      login_success: 'Login successful!',
      register_success: 'Registration successful!',
      login_failed: 'Invalid email or password',
      register_failed: 'Registration failed: ',
      email_exists: 'Email already registered',
      username_required: 'Please enter a username',
      secure_note: '🔒 All passwords stored locally encrypted, never sent in plaintext',
      or: 'or',
    },
  };
  const T = L[isZh ? 'zh' : 'en'];

  const showToast = (msg, type = 'info') => {
    setToastMsg({ msg, type, id: Date.now() });
    setTimeout(() => setToastMsg(null), 2500);
  };

  const validateEmail = (e) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const emailVal = email.trim().toLowerCase();
    const pwdVal = password;

    if (!emailVal) { setError(T.email_required); return; }
    if (!validateEmail(emailVal)) { setError(T.email_required); return; }
    if (!pwdVal) { setError(T.password_required); return; }

    if (tab === 'register') {
      if (!username.trim()) { setError(T.username_required); return; }
      if (pwdVal.length < 6) { setError(T.password_min); return; }
      if (pwdVal !== confirmPassword) { setError(T.password_mismatch); return; }
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        const result = await login({ email: emailVal, password: pwdVal });
        if (!result) {
          setError(T.login_failed);
        } else {
          showToast(T.login_success, 'success');
          setTimeout(() => onNavigate?.('Dashboard'), 500);
          return;
        }
      } else {
        try {
          const result = await register({ username: username.trim(), email: emailVal, password: pwdVal });
          showToast(T.register_success, 'success');
          setTimeout(() => onNavigate?.('Dashboard'), 500);
          return;
        } catch (re) {
          const msg = re.message || '';
          if (msg.includes('already')) setError(T.email_exists);
          else setError(T.register_failed + msg);
        }
      }
    } catch (err) {
      setError(err.message || (tab === 'login' ? T.login_failed : 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    try {
      const GUEST_KEY = 'zmusic_users';
      const raw = localStorage.getItem(GUEST_KEY);
      const store = raw ? JSON.parse(raw) : { users: [], activeUserId: null };
      store.activeUserId = 'guest';
      localStorage.setItem(GUEST_KEY, JSON.stringify(store));
    } catch (_) {}
    showToast(isZh ? '已进入访客模式' : 'Guest mode activated', 'success');
    setTimeout(() => onNavigate?.('Dashboard'), 400);
  };

  const inputBase = 'w-full bg-black/40 border border-white/10 focus:border-violet-500/50 focus:bg-violet-500/5 focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 transition-all';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a14] via-violet-950/20 to-fuchsia-950/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-fuchsia-500/40">
              <Music2 className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
                ZMusic
              </h1>
              <p className="text-xs text-gray-500">
                {isZh ? 'AI 音乐创作平台' : 'AI Music Creation Platform'}
              </p>
            </div>
          </div>
        </div>

        <div className="gradient-border rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 md:p-8 bg-[#0a0a14]/60">
            <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-6">
              <button
                onClick={() => { setTab('login'); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${tab === 'login'
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                <LogIn className="w-4 h-4" />
                {T.login_tab}
              </button>
              <button
                onClick={() => { setTab('register'); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${tab === 'register'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                <UserPlus className="w-4 h-4" />
                {T.register_tab}
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-1">
                {tab === 'login' ? (
                  <><Sparkles className="w-4 h-4 inline text-amber-400 mr-1.5" />{T.welcome_back}</>
                ) : (
                  <><Sparkles className="w-4 h-4 inline text-violet-400 mr-1.5" />{T.create_account}</>
                )}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                    {T.username}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder={isZh ? '请输入用户名' : 'Enter username'}
                    className={inputBase}
                    autoComplete="username"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  {T.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={isZh ? 'you@example.com' : 'you@example.com'}
                  className={inputBase}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-gray-500" />
                  {T.password}
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={isZh ? '请输入密码' : 'Enter password'}
                    className={inputBase + ' pr-11'}
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-gray-500" />
                    {T.confirm_password}
                  </label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={isZh ? '再次输入密码' : 'Re-enter password'}
                    className={inputBase}
                    autoComplete="new-password"
                  />
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2 text-sm text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-400 hover:via-fuchsia-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/30 hover:scale-[1.005] active:scale-[0.995] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
                ) : tab === 'login' ? (
                  <><LogIn className="w-4 h-4" />{T.login_btn}</>
                ) : (
                  <><UserPlus className="w-4 h-4" />{T.register_btn}</>
                )}
              </button>

              <div className="text-center">
                <span className="text-xs text-gray-500">
                  {tab === 'login' ? T.no_account : T.has_account}{' '}
                </span>
                <button
                  type="button"
                  onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }}
                  className="text-xs font-semibold text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                >
                  {tab === 'login' ? T.go_register : T.go_login} <ArrowRight className="w-3 h-3 inline" />
                </button>
              </div>

              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[11px] text-gray-500">{T.or}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button
                type="button"
                onClick={handleGuest}
                className="w-full py-3 rounded-xl text-sm font-semibold text-gray-200 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Music2 className="w-4 h-4 text-violet-400" />
                {T.continue_guest}
              </button>

              <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-2.5 flex items-start gap-2 text-[10.5px] text-violet-300/80">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{T.secure_note}</span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div
          className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm animate-slide-in ${toastMsg.type === 'success'
            ? 'bg-emerald-500/90 text-white border border-emerald-400/50'
            : toastMsg.type === 'error'
              ? 'bg-red-500/90 text-white border border-red-400/50'
              : 'bg-violet-500/90 text-white border border-violet-400/50'
            }`}
        >
          {toastMsg.msg}
        </div>
      )}
    </div>
  );
}
