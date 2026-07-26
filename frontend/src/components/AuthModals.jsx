import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User, ArrowRight, Sparkles, KeyRound } from 'lucide-react';

export const AuthModals = () => {
  const { activeModal, setActiveModal, login, register, requestPasswordReset, resetPassword, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  // Bước của luồng quên mật khẩu: 'request' (nhập email) -> 'confirm' (nhập mã + mật khẩu mới)
  const [resetStep, setResetStep] = useState('request');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(typeof window !== 'undefined' && Boolean(window.google?.accounts?.id));
  const googleButtonRef = useRef(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (googleReady) return;
    if (typeof window === 'undefined') return;

    const timer = window.setInterval(() => {
      if (window.google?.accounts?.id) {
        setGoogleReady(true);
        window.clearInterval(timer);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [googleReady]);

  // Đóng modal bằng phím Escape
  useEffect(() => {
    if (!activeModal) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
        setErrorMsg('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal, setActiveModal]);

  useEffect(() => {
    if (!activeModal || !googleClientId || !googleReady || !googleButtonRef.current) return;

    googleButtonRef.current.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        if (!response?.credential) return;
        setErrorMsg('');
        setGoogleLoading(true);
        const res = await loginWithGoogle(response.credential);
        if (!res.success) setErrorMsg(res.message);
        setGoogleLoading(false);
      },
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline',
      size: 'large',
      shape: 'pill',
      text: activeModal === 'register' ? 'signup_with' : 'signin_with',
      width: 368,
      locale: 'vi',
    });
  }, [activeModal, googleClientId, googleReady, loginWithGoogle]);

  // Đếm ngược cho nút "Gửi lại mã"
  // Lưu ý: hook này PHẢI nằm trước early return `if (!activeModal) return null;`
  // để không vi phạm Rules of Hooks (tránh lỗi màn hình đen khi mở modal).
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setTimeout(() => setResendCountdown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  if (!activeModal) return null;

  const handleClose = () => {
    setActiveModal(null);
    setErrorMsg('');
    setPassword('');
    setNewPassword('');
    setResetCode('');
    setResetStep('request');
    setResendCountdown(0);
  };

  const handleRequestCode = async () => {
    const res = await requestPasswordReset(email);
    if (res.success) {
      setResetStep('confirm');
      setResendCountdown(60);
    } else {
      setErrorMsg(res.message);
    }
    return res;
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0 || submitting) return;
    setErrorMsg('');
    setSubmitting(true);
    const res = await requestPasswordReset(email);
    if (res.success) {
      setResendCountdown(60);
    } else {
      setErrorMsg(res.message);
    }
    setSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    if (activeModal === 'login') {
      const res = await login(email, password);
      if (!res.success) setErrorMsg(res.message);
    } else if (activeModal === 'register') {
      const res = await register(fullName, email, password);
      if (!res.success) setErrorMsg(res.message);
    } else if (activeModal === 'reset') {
      if (resetStep === 'request') {
        // Bước 1: gửi mã xác nhận về email
        await handleRequestCode();
      } else {
        // Bước 2: xác nhận mã + đặt mật khẩu mới
        const res = await resetPassword(email, resetCode, newPassword);
        if (!res.success) {
          setErrorMsg(res.message);
        } else {
          setResetCode('');
          setNewPassword('');
          setResetStep('request');
        }
      }
    }

    setSubmitting(false);
  };

  const switchModal = (target) => {
    setErrorMsg('');
    setResetStep('request');
    setResetCode('');
    setActiveModal(target);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xl p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md km-auth-card overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner header */}
        <div className="km-auth-banner p-6 text-white text-center relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex p-2.5 rounded-2xl bg-white/15 backdrop-blur-md mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">
            {activeModal === 'login' && 'Chào Mừng Trở Lại'}
            {activeModal === 'register' && 'Tạo Tài Khoản Mới'}
            {activeModal === 'reset' && 'Đặt Lại Mật Khẩu'}
          </h3>
          <p className="text-xs text-emerald-100 mt-1 font-medium">
            {activeModal === 'login' && 'Chia sẻ việc tốt và tích lũy điểm công dân số'}
            {activeModal === 'register' && 'Đăng ký ngay để nhận +10 điểm công dân số'}
            {activeModal === 'reset' && (resetStep === 'request'
              ? 'Nhập email để nhận mã xác nhận gồm 6 chữ số'
              : `Nhập mã đã gửi tới ${email} và mật khẩu mới`)}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-2xl text-xs font-medium border border-rose-200 dark:border-rose-800">
              {errorMsg}
            </div>
          )}

          {activeModal === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trần Minh Tuấn"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 km-auth-input rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                disabled={activeModal === 'reset' && resetStep === 'confirm'}
                placeholder="name@example.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 km-auth-input rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-60"
              />
            </div>
            {activeModal === 'reset' && resetStep === 'confirm' && (
              <div className="text-right mt-1.5">
                <button
                  type="button"
                  onClick={() => { setResetStep('request'); setResetCode(''); setErrorMsg(''); }}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Dùng email khác?
                </button>
              </div>
            )}
          </div>

          {activeModal !== 'reset' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={activeModal === 'register' ? 6 : undefined}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 km-auth-input rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
              {activeModal === 'register' && (
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">Tối thiểu 6 ký tự.</p>
              )}
              {activeModal === 'login' && (
                <div className="text-right mt-1.5">
                  <button
                    type="button"
                    onClick={() => switchModal('reset')}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}
            </div>
          )}

          {activeModal === 'reset' && resetStep === 'confirm' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã xác nhận (6 chữ số)</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="Ví dụ: 123456"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-11 pr-4 py-3 km-auth-input rounded-2xl text-sm tracking-[0.3em] font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Mã có hiệu lực trong 10 phút.</p>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCountdown > 0 || submitting}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {resendCountdown > 0 ? `Gửi lại mã (${resendCountdown}s)` : 'Gửi lại mã'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 km-auth-input rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">Tối thiểu 6 ký tự.</p>
              </div>
            </>
          )}

          {activeModal !== 'reset' && (
            <div className="flex flex-col gap-3">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-x-0 top-1/2 border-t border-slate-200 dark:border-slate-800" />
                <span className="relative px-3 bg-white dark:bg-slate-900 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  hoặc
                </span>
              </div>

              {googleClientId && googleReady ? (
                <div className="relative min-h-[44px] flex items-center justify-center">
                  <div ref={googleButtonRef} className="w-full flex justify-center" />
                  {googleLoading && (
                    <div className="absolute inset-0 rounded-2xl bg-white/70 dark:bg-slate-900/70 flex items-center justify-center">
                      <span className="inline-block w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-medium border border-slate-200 dark:border-slate-700 text-center">
                  {googleClientId ? 'Đang tải đăng nhập Google...' : 'Nút đăng nhập Google bị ẩn (chưa thiết lập Client ID).'}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || googleLoading}
            className="w-full mt-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {submitting ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {activeModal === 'login' && 'Đăng Nhập'}
                {activeModal === 'register' && 'Đăng Ký Tài Khoản'}
                {activeModal === 'reset' && (resetStep === 'request' ? 'Gửi Mã Xác Nhận' : 'Đặt Lại Mật Khẩu')}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-1 text-center">
            {activeModal === 'login' ? (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => switchModal('register')}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Đăng ký ngay
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => switchModal('login')}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Đăng nhập
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
