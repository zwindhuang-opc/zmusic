import React, { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Lock, LogIn, UserPlus, Sparkles, Music2, ArrowRight,
  Eye, EyeOff, ShieldCheck, AlertCircle, Smartphone, MessageSquare,
  CheckCircle2, Send, RefreshCw,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage({ onNavigate }) {
  const { lang } = useTranslation();
  const isZh = lang === 'zh';
  const {
    login, register, logout, sendSmsCode, smsProvider, enterGuest,
  } = useAuth();

  // --- Tab state --------------------------------------------------------
  // mode: 'login' | 'register'
  // authMethod: 'email' | 'phone'
  const [mode, setMode] = useState('login');
  const [authMethod, setAuthMethod] = useState('email');
  // --- Email form -------------------------------------------------------
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // --- Phone form -------------------------------------------------------
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [oneTimeToken, setOneTimeToken] = useState('');
  const [phonePassword, setPhonePassword] = useState('');   // optional (for login + reset)
  const [phoneLoginMethod, setPhoneLoginMethod] = useState('sms'); // 'sms' | 'password'
  const [countdown, setCountdown] = useState(0);
  // --- UX ---------------------------------------------------------------
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const countdownRef = useRef(null);

  // --- Config fetch on mount -------------------------------------------
  useEffect(() => {
    return () => clearInterval(countdownRef.current);
  }, []);

  // --- Countdown for SMS resend cooldown ------------------------------
  useEffect(() => {
    if (countdown <= 0) { clearInterval(countdownRef.current); return; }
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(countdownRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [countdown]);

  const L = {
    zh: {
      login_tab: '登录',
      register_tab: '注册',
      email_method: '邮箱',
      phone_method: '手机',
      phone_login_sms: '验证码登录',
      phone_login_pwd: '密码登录',
      welcome_back: '欢迎回来，继续创作你的音乐',
      create_account: '创建新账号，开启 AI 音乐之旅',
      email: '邮箱地址',
      username: '用户名',
      password: '密码',
      confirm_password: '确认密码',
      phone: '手机号',
      sms_code: '短信验证码',
      get_code: '获取验证码',
      resend_in: '{n}秒后重发',
      verified: '已验证',
      login_btn: '登录',
      register_btn: '注册账号',
      continue_guest: '无需账号继续浏览',
      forgot_pwd: '忘记密码？',
      no_account: '还没有账号？',
      has_account: '已有账号？',
      go_register: '去注册',
      go_login: '去登录',
      email_required: '请输入邮箱',
      email_invalid: '邮箱格式不正确',
      phone_required: '请输入手机号',
      phone_invalid: '请输入正确的手机号',
      password_required: '请输入密码',
      password_mismatch: '两次输入的密码不一致',
      password_min: '密码至少需要 6 位',
      sms_required: '请输入 6 位验证码',
      sms_incorrect: '验证码错误或已过期',
      sms_sent: '验证码已发送',
      login_success: '登录成功！',
      register_success: '注册成功！',
      login_failed: '账号或密码错误',
      register_failed: '注册失败：',
      email_exists: '该邮箱已注册',
      phone_exists: '该手机号已注册',
      username_required: '请输入用户名',
      secure_note: '🔒 账号密码在服务端加密存储，支持手机短信验证',
      or: '或',
      dev_sms_hint: '⚠️ 开发模式：验证码已打印在服务器控制台，也会显示为下方提示',
      sms_provider_dev: '开发模式',
    },
    en: {
      login_tab: 'Login',
      register_tab: 'Register',
      email_method: 'Email',
      phone_method: 'Phone',
      phone_login_sms: 'SMS code',
      phone_login_pwd: 'Password',
      welcome_back: 'Welcome back — continue creating your music',
      create_account: 'Create an account to start your AI music journey',
      email: 'Email',
      username: 'Username',
      password: 'Password',
      confirm_password: 'Confirm Password',
      phone: 'Phone number',
      sms_code: 'SMS code',
      get_code: 'Send code',
      resend_in: 'Resend in {n}s',
      verified: 'Verified',
      login_btn: 'Sign in',
      register_btn: 'Create account',
      continue_guest: 'Continue without account',
      forgot_pwd: 'Forgot password?',
      no_account: "Don't have an account?",
      has_account: 'Already have an account?',
      go_register: 'Register',
      go_login: 'Login',
      email_required: 'Please enter your email',
      email_invalid: 'Invalid email format',
      phone_required: 'Please enter your phone',
      phone_invalid: 'Invalid phone number',
      password_required: 'Please enter your password',
      password_mismatch: 'Passwords do not match',
      password_min: 'Password must be at least 6 characters',
      sms_required: 'Please enter 6-digit SMS code',
      sms_incorrect: 'Invalid or expired SMS code',
      sms_sent: 'Verification code sent',
      login_success: 'Login successful!',
      register_success: 'Registration successful!',
      login_failed: 'Invalid email or password',
      register_failed: 'Registration failed: ',
      email_exists: 'Email already registered',
      phone_exists: 'Phone already registered',
      username_required: 'Please enter a username',
      secure_note: '🔒 Passwords stored server-side hashed. Phone + SMS supported',
      or: 'or',
      dev_sms_hint: '⚠️ DEV MODE: Code printed in server console + shown below',
      sms_provider_dev: 'Dev mode',
    },
  };
  const T = L[isZh ? 'zh' : 'en'];

  const showToast = (msg, type = 'info') => {
    setToastMsg({ msg, type, id: Date.now() });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());
  const validatePhone = (p) => /^(\+\d{1,4})?\d{8,15}$/.test(String(p || '').replace(/[\s\-()]/g, ''));

  // --- Helpers to choose the right error message based on backend code --
  const backendErrorToMsg = (dataOrErr) => {
    // dataOrErr may be: { error, message_zh, message_en } from backend
    // OR a plain Error whose message is the error code string
    let code = null;
    let preferred = null;
    if (dataOrErr) {
      if (typeof dataOrErr === 'object') {
        code = dataOrErr.error;
        preferred = isZh ? dataOrErr.message_zh : dataOrErr.message_en;
        // Error-style thrown from AuthContext: message = code or text
        if (!code && dataOrErr.message) {
          // Could be a human message — return as-is if EN/zh words detected
          const msg = dataOrErr.message;
          if (/[A-Za-z]{3,}/.test(msg) || /[\u4e00-\u9fa5]/.test(msg)) return msg;
          code = msg;
        }
      } else if (typeof dataOrErr === 'string') {
        code = dataOrErr;
      } else if (dataOrErr?.message) {
        return dataOrErr.message;
      }
    }
    if (preferred) return preferred;
    const map = {
      EMAIL_REQUIRED: T.email_required,
      EMAIL_INVALID: T.email_invalid,
      EMAIL_EXISTS: T.email_exists,
      EMAIL_NOT_FOUND: T.login_failed,
      PHONE_REQUIRED: T.phone_required,
      PHONE_INVALID: T.phone_invalid,
      PHONE_EXISTS: T.phone_exists,
      PHONE_NOT_FOUND: T.login_failed,
      PWD_REQUIRED: T.password_required,
      PWD_TOO_SHORT: T.password_min,
      PWD_MISMATCH: T.login_failed,
      SMS_CODE_REQUIRED: T.sms_required,
      SMS_INVALID: T.sms_incorrect,
      SMS_EXPIRED: T.sms_incorrect,
      SMS_SEND_FAIL: isZh ? '短信发送失败，请稍后重试' : 'SMS send failed, please retry',
      NEED_CODE: T.sms_required,
      NO_LOGIN_METHOD: isZh ? '请填写登录信息' : 'Please fill in credentials',
    };
    return map[code] || dataOrErr?.message_en || dataOrErr?.error || dataOrErr?.message || code || T.login_failed;
  };

  // --- SMS send handler ------------------------------------------------
  async function handleSendSms() {
    setError('');
    if (!validatePhone(phone)) { setError(T.phone_invalid); return; }
    setSendingSms(true);
    try {
      const purpose = mode === 'register' ? 'register' : mode === 'login' ? 'login' : 'register';
      const data = await sendSmsCode({ phone, purpose, lang: isZh ? 'zh' : 'en' });
      setSmsSent(true);
      setCountdown(60);
      showToast(T.sms_sent, 'success');
      // DEV mode convenience: autofill the SMS code
      if (data?.devCode) {
        setSmsCode(String(data.devCode));
        showToast(`${isZh ? '开发模式验证码:' : 'DEV code: '} ${data.devCode}`, 'info');
      }
    } catch (e) {
      setError(backendErrorToMsg(e));
    } finally {
      setSendingSms(false);
    }
  }

  // --- Submit handler --------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    let requestBody;
    // --- Build request based on active method ------------------------
    if (authMethod === 'email') {
      const emailLc = email.trim().toLowerCase();
      if (!emailLc) { setError(T.email_required); return; }
      if (!validateEmail(emailLc)) { setError(T.email_invalid); return; }
      if (!password) { setError(T.password_required); return; }

      if (mode === 'register') {
        if (!username.trim()) { setError(T.username_required); return; }
        if (password.length < 6) { setError(T.password_min); return; }
        if (password !== confirmPassword) { setError(T.password_mismatch); return; }
      }
      requestBody = {
        method: 'email',
        email: emailLc,
        username: username.trim(),
        password,
      };
    } else {
      // Phone method
      if (!validatePhone(phone)) { setError(T.phone_invalid); return; }

      if (mode === 'register') {
        // Phone register requires SMS code
        if (!smsCode || smsCode.length < 4) { setError(T.sms_required); return; }
        if (password && password.length < 6) { setError(T.password_min); return; }
        if (password && password !== confirmPassword) { setError(T.password_mismatch); return; }
        requestBody = {
          method: 'phone',
          username: username.trim() || undefined,
          phone, smsCode,
          oneTimeToken: oneTimeToken || undefined,
          password: password || undefined,
        };
      } else {
        // Login
        if (phoneLoginMethod === 'sms') {
          if (!smsCode || smsCode.length < 4) { setError(T.sms_required); return; }
          requestBody = { method: 'phone', phone, smsCode, oneTimeToken: oneTimeToken || undefined };
        } else {
          if (!phonePassword) { setError(T.password_required); return; }
          requestBody = { method: 'phone', phone, password: phonePassword };
        }
      }
    }

    setLoading(true);
    try {
      let userObj;
      if (mode === 'register') {
        userObj = await register(requestBody);
      } else {
        userObj = await login(requestBody);
      }
      showToast(mode === 'register' ? T.register_success : T.login_success, 'success');
      setTimeout(() => onNavigate?.('dashboard' || 'Dashboard'), 500);
    } catch (err) {
      setError(backendErrorToMsg(err));
    } finally {
      setLoading(false);
    }
  }

  const handleGuest = () => {
    // Establish a real guest session in AuthContext. Setting user to null
    // here would make the App-level auth guard bounce straight back to this
    // login page, so the guest button would appear to do nothing.
    enterGuest?.();
    showToast(isZh ? '已进入访客模式' : 'Guest mode activated', 'success');
    setTimeout(() => onNavigate?.('dashboard'), 400);
  };

  const inputBase = 'w-full bg-black/40 border border-white/10 focus:border-violet-500/50 focus:bg-violet-500/5 focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 transition-all';
  const subBtnBase = 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed';

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
            {/* ---- Top: Login / Register ---- */}
            <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-5">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${mode === 'login'
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                <LogIn className="w-4 h-4" />
                {T.login_tab}
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${mode === 'register'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                <UserPlus className="w-4 h-4" />
                {T.register_tab}
              </button>
            </div>

            {/* ---- Method: Email / Phone ---- */}
            <div className="flex items-center gap-1.5 mb-5 p-1 rounded-lg bg-white/5 border border-white/10">
              <button
                onClick={() => { setAuthMethod('email'); setError(''); }}
                className={`flex-1 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${authMethod === 'email'
                  ? 'bg-white/10 text-violet-200'
                  : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Mail className="w-3.5 h-3.5" />{T.email_method}
              </button>
              <button
                onClick={() => { setAuthMethod('phone'); setError(''); }}
                className={`flex-1 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${authMethod === 'phone'
                  ? 'bg-white/10 text-fuchsia-200'
                  : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Smartphone className="w-3.5 h-3.5" />{T.phone_method}
                {smsProvider === 'dev' && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                    {T.sms_provider_dev}
                  </span>
                )}
              </button>
            </div>

            <div className="mb-5">
              <h2 className="text-lg font-bold text-white mb-1">
                {mode === 'login' ? (
                  <><Sparkles className="w-4 h-4 inline text-amber-400 mr-1.5" />{T.welcome_back}</>
                ) : (
                  <><Sparkles className="w-4 h-4 inline text-violet-400 mr-1.5" />{T.create_account}</>
                )}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ====== EMAIL METHOD ====== */}
              {authMethod === 'email' && (
                <>
                  {mode === 'register' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-500" />{T.username}
                      </label>
                      <input type="text" value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder={isZh ? '请输入用户名' : 'Enter username'}
                        className={inputBase} autoComplete="username" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />{T.email}
                    </label>
                    <input type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputBase} autoComplete="email" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-gray-500" />{T.password}
                    </label>
                    <div className="relative">
                      <input type={showPwd ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={isZh ? '请输入密码' : 'Enter password'}
                        className={inputBase + ' pr-11'}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                      <button type="button" onClick={() => setShowPwd(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1" tabIndex={-1}>
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-gray-500" />{T.confirm_password}
                      </label>
                      <input type={showPwd ? 'text' : 'password'} value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder={isZh ? '再次输入密码' : 'Re-enter password'}
                        className={inputBase} autoComplete="new-password" />
                    </div>
                  )}
                </>
              )}

              {/* ====== PHONE METHOD ====== */}
              {authMethod === 'phone' && (
                <>
                  {mode === 'register' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-500" />{T.username}
                        <span className="text-gray-500 font-normal">({isZh ? '可选' : 'optional'})</span>
                      </label>
                      <input type="text" value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder={isZh ? '请输入用户名' : 'Enter username'}
                        className={inputBase} autoComplete="username" />
                    </div>
                  )}

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-gray-500" />{T.phone}
                    </label>
                    <input type="tel" value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder={isZh ? '13800138000 或 +86 138...' : '13800138000 or +86 138...'}
                      className={inputBase} autoComplete="tel" />
                  </div>

                  {/* SMS code + send button */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-500" />{T.sms_code}
                    </label>
                    <div className="flex gap-2">
                      <input type="text" inputMode="numeric" maxLength={8} value={smsCode}
                        onChange={e => setSmsCode(e.target.value.replace(/\D/g, ''))}
                        placeholder={isZh ? '6位验证码' : '6-digit code'}
                        className={inputBase + ' flex-1'} autoComplete="one-time-code" />
                      <button
                        type="button"
                        disabled={sendingSms || countdown > 0 || !validatePhone(phone)}
                        onClick={handleSendSms}
                        className={subBtnBase + ' bg-violet-500/20 text-violet-200 border-violet-500/40 hover:bg-violet-500/30'}
                      >
                        {sendingSms
                          ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />{isZh ? '发送中' : 'Sending'}</>
                          : countdown > 0
                            ? <>{T.resend_in.replace('{n}', countdown)}</>
                            : smsSent
                              ? <><RefreshCw className="w-3.5 h-3.5" />{isZh ? '重新获取' : 'Resend'}</>
                              : <><Send className="w-3.5 h-3.5" />{T.get_code}</>}
                      </button>
                    </div>
                    {/* Dev mode hint */}
                    {smsProvider === 'dev' && smsSent && (
                      <p className="mt-1.5 text-[10.5px] text-amber-300/90 flex items-start gap-1">
                        <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {T.dev_sms_hint}
                      </p>
                    )}
                  </div>

                  {/* Phone login: choose SMS vs Password */}
                  {mode === 'login' && (
                    <div className="flex gap-1.5 p-1 rounded-lg bg-white/5 border border-white/10">
                      <button type="button" onClick={() => setPhoneLoginMethod('sms')}
                        className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${phoneLoginMethod === 'sms'
                          ? 'bg-fuchsia-500/20 text-fuchsia-200'
                          : 'text-gray-500 hover:text-gray-300'}`}>
                        <MessageSquare className="w-3 h-3 inline mr-1" />{T.phone_login_sms}
                      </button>
                      <button type="button" onClick={() => setPhoneLoginMethod('password')}
                        className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${phoneLoginMethod === 'password'
                          ? 'bg-fuchsia-500/20 text-fuchsia-200'
                          : 'text-gray-500 hover:text-gray-300'}`}>
                        <Lock className="w-3 h-3 inline mr-1" />{T.phone_login_pwd}
                      </button>
                    </div>
                  )}

                  {mode === 'login' && phoneLoginMethod === 'password' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-gray-500" />{T.password}
                      </label>
                      <input type={showPwd ? 'text' : 'password'} value={phonePassword}
                        onChange={e => setPhonePassword(e.target.value)}
                        placeholder={isZh ? '请输入密码' : 'Enter password'}
                        className={inputBase} autoComplete="current-password" />
                    </div>
                  )}

                  {/* Phone register: optional password (can be set later) */}
                  {mode === 'register' && authMethod === 'phone' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-gray-500" />{T.password}
                          <span className="text-gray-500 font-normal">({isZh ? '可选' : 'optional'})</span>
                        </label>
                        <input type={showPwd ? 'text' : 'password'} value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder={isZh ? '可留空，稍后在设置中绑定' : 'Optional — set later'}
                          className={inputBase} autoComplete="new-password" />
                      </div>
                      {password && (
                        <div>
                          <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-gray-500" />{T.confirm_password}
                          </label>
                          <input type={showPwd ? 'text' : 'password'} value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder={isZh ? '再次输入密码' : 'Re-enter password'}
                            className={inputBase} autoComplete="new-password" />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Error box */}
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2 text-sm text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Primary action */}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-400 hover:via-fuchsia-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/30 hover:scale-[1.005] active:scale-[0.995] transition-all flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
                  : mode === 'login'
                    ? <><LogIn className="w-4 h-4" />{T.login_btn}</>
                    : <><UserPlus className="w-4 h-4" />{T.register_btn}</>}
              </button>

              {/* Switch login/register */}
              <div className="text-center">
                <span className="text-xs text-gray-500">
                  {mode === 'login' ? T.no_account : T.has_account}{' '}
                </span>
                <button type="button"
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                  className="text-xs font-semibold text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
                  {mode === 'login' ? T.go_register : T.go_login} <ArrowRight className="w-3 h-3 inline" />
                </button>
              </div>

              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[11px] text-gray-500">{T.or}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Guest entry */}
              <button type="button" onClick={handleGuest}
                className="w-full py-3 rounded-xl text-sm font-semibold text-gray-200 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2">
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
        <div className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm animate-slide-in ${toastMsg.type === 'success'
          ? 'bg-emerald-500/90 text-white border border-emerald-400/50'
          : toastMsg.type === 'error'
            ? 'bg-red-500/90 text-white border border-red-400/50'
            : 'bg-violet-500/90 text-white border border-violet-400/50'
          }`}>
          {toastMsg.msg}
        </div>
      )}
    </div>
  );
}
