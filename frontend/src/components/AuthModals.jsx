import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

export const AuthModals = () => {
  const { activeModal, setActiveModal, login, register, resetPassword, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
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

  if (!activeModal) return null;

  const handleClose = () => {
    setActiveModal(null);
    setErrorMsg('');
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
      const res = await resetPassword(email, newPassword);
      if (!res.success) setErrorMsg(res.message);
    }

    setSubmitting(false);
  };

  const switchModal = (target) => {
    setErrorMsg('');
    setActiveModal(target);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 backdrop-blur-xl p-4 animate-fade-in">
      <div className="relative w-full max-w-md km-auth-card overflow-hidden animate-slide-up">
        {/* Banner header */}
        <div className="km-auth-banner p-7 text-white text-center relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 dark:bg-slate-800/50 hover:bg-white/20 dark:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex p-3 rounded-2xl bg-white/15 dark:bg-slate-800/50 backdrop-blur-md mb-2">
            <Sparkles className="w-7 h-7 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <h3 className="text-xl font-bold">
            {activeModal === 'login' && 'Chào Mừng Trở Lại!'}
            {activeModal === 'register' && 'Tham Gia Cộng Đồng Việc Tốt'}
            {activeModal === 'reset' && 'Đặt Lại Mật Khẩu'}
          </h3>
          <p className="text-xs text-emerald-100 mt-1">
            {activeModal === 'login' && 'Cùng lan tỏa những điều tử tế mỗi ngày'}
            {activeModal === 'register' && 'Tạo tài khoản để nhận ngay +10 điểm công dân số'}
            {activeModal === 'reset' && 'Khôi phục quyền truy cập Bản Đồ Việc Tốt'}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-2xl text-xs font-medium border border-rose-200">
              {errorMsg}
            </div>
          )}

          {activeModal === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 dark:text-slate-400 mb-1">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trần Minh Tuấn"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 km-auth-input rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 dark:text-slate-400 mb-1">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                required
                placeholder="name@example.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 km-auth-input rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
              />
            </div>
          </div>

          {activeModal !== 'reset' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 dark:text-slate-400 mb-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 km-auth-input rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                />
              </div>
              {activeModal === 'login' && (
                <div className="text-right mt-1.5">
                  <button
                    type="button"
                    onClick={() => switchModal('reset')}
                    className="text-xs font-medium text-brand-green hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}
            </div>
          )}

          {activeModal === 'reset' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 dark:text-slate-400 mb-1">Mật khẩu mới</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 km-auth-input rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                />
              </div>
            </div>
          )}


          {activeModal !== 'reset' && (
            <div className="flex flex-col gap-3">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-x-0 top-1/2 border-t border-slate-100 dark:border-slate-800" />
                <span className="relative px-3 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  hoặc
                </span>
              </div>

              {googleClientId && googleReady ? (
                <div className="relative min-h-[44px] flex items-center justify-center">
                  <div ref={googleButtonRef} className="w-full flex justify-center" />
                  {googleLoading && (
                    <div className="absolute inset-0 rounded-2xl bg-white/70 dark:bg-slate-900/70 flex items-center justify-center">
                      <span className="inline-block w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-200 dark:border-amber-500/20">
                  {googleClientId ? 'Đang tải nút đăng nhập Google...' : 'Chưa cấu hình VITE_GOOGLE_CLIENT_ID nên nút đăng nhập Google đang bị ẩn.'}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || googleLoading}
            className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {submitting ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {activeModal === 'login' && 'Đăng Nhập'}
                {activeModal === 'register' && 'Đăng Ký Tài Khoản'}
                {activeModal === 'reset' && 'Khôi Phục Mật Khẩu'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2 text-center">
            {activeModal === 'login' ? (
              <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => switchModal('register')}
                  className="font-bold text-brand-green hover:underline"
                >
                  Đăng ký ngay
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => switchModal('login')}
                  className="font-bold text-brand-green hover:underline"
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
