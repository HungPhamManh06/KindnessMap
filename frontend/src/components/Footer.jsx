import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HeartHandshake,
  MapPin,
  Mail,
  Heart,
  Shield,
  Sparkles,
  Github,
  Facebook,
  ArrowRight,
} from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-slate-900 text-slate-400 pt-20 pb-10 border-t border-slate-800 mt-20">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/4 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-14 border-b border-slate-800/70">

          {/* Brand Vision */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 8px 24px -8px rgba(16,185,129,0.5)' }}
              >
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl text-white tracking-tight leading-none">KindnessMap</span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-500 mt-0.5">Bản Đồ Việc Tốt</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed pr-4">
              Nền tảng cộng đồng khuyến khích và kết nối mọi người cùng chia sẻ những hành động tử tế,
              gieo mầm hy vọng và xóa nhòa sự vô cảm trong xã hội.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Chung tay vì một Việt Nam nhân ái hơn.</span>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition-colors text-slate-400 hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-600 flex items-center justify-center transition-colors text-slate-400 hover:text-white"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="mailto:contact@kindnessmap.vn"
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-emerald-600 flex items-center justify-center transition-colors text-slate-400 hover:text-white"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Đối tượng tham gia */}
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-5">Đối Tượng</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              {[
                { emoji: '👨‍🎓', label: 'Học sinh / Sinh viên' },
                { emoji: '💚', label: 'Tình nguyện viên' },
                { emoji: '🏡', label: 'Người dân địa phương' },
                { emoji: '🏢', label: 'Tổ chức & CLB Cộng đồng' },
              ].map((item) => (
                <li key={item.label} className="hover:text-white transition-colors cursor-default">
                  {item.emoji} {item.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Điều hướng */}
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-5">Điều Hướng</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              {[
                { to: '/explore',     label: 'Bản Đồ Tương Tác' },
                { to: '/stories',     label: 'Câu Chuyện Việc Tốt' },
                { to: '/leaderboard', label: 'Bảng Xếp Hạng' },
                { to: '/awards',      label: 'Giải Thưởng Tháng' },
                { to: '/matching',    label: 'AI Ghép Nối' },
              ].map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className="hover:text-white transition-colors flex items-center gap-1.5 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-emerald-400" />
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Liên hệ */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">Liên Hệ</h4>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Hà Nội & TP. Hồ Chí Minh</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
              <a href="mailto:contact@kindnessmap.vn" className="hover:text-white transition-colors">
                contact@kindnessmap.vn
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Bảo mật & Điều khoản</span>
            </div>

            {/* Admin badge */}
            <NavLink
              to="/admin"
              className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-all w-fit"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Panel
            </NavLink>
          </div>
        </div>

        {/* Copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500">
            © 2026 KindnessMap – Bản Đồ Việc Tốt. Tất cả các quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 mx-1 animate-pulse" />
            <span>for active citizens in Vietnam 🇻🇳</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
