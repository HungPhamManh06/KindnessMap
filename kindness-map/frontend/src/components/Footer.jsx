import React from 'react';
import { NavLink } from 'react-router-dom';
import { HeartHandshake, MapPin, Mail, Phone, Heart, Shield, Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-12 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Vision */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-green to-brand-teal flex items-center justify-center text-white shadow-lg shadow-brand-green/20">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">KindnessMap</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed pr-6">
              Nền tảng cộng đồng Bản Đồ Việc Tốt khuyến khích và kết nối mọi người cùng chia sẻ những hành động tử tế, gieo mầm hy vọng và xóa nhòa sự vô cảm trong xã hội.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-emerald-400">
              <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Chung tay vì một Việt Nam xanh, sạch và nhân ái hơn.</span>
            </div>
          </div>

          {/* User roles links */}
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Đối Tượng Tham Gia</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li className="hover:text-white transition-colors">👨‍🎓 Học sinh / Sinh viên</li>
              <li className="hover:text-white transition-colors">💚 Tình nguyện viên</li>
              <li className="hover:text-white transition-colors">🏡 Người dân địa phương</li>
              <li className="hover:text-white transition-colors">🏢 Tổ chức & CLB Cộng đồng</li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Điều Hướng</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <NavLink to="/explore" className="hover:text-white transition-colors">Bản Đồ Tương Tác</NavLink>
              </li>
              <li>
                <NavLink to="/stories" className="hover:text-white transition-colors">Câu Chuyện Việc Tốt</NavLink>
              </li>
              <li>
                <NavLink to="/leaderboard" className="hover:text-white transition-colors">Bảng Xếp Hạng Điểm</NavLink>
              </li>
              <li>
                <NavLink to="/awards" className="hover:text-white transition-colors">Giải Thưởng Tháng</NavLink>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-2">Liên Hệ Hub</h4>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-brand-green" />
              <span>Hà Nội & TP. Hồ Chí Minh</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-brand-green" />
              <span>contact@kindnessmap.vn</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-brand-green" />
              <span>0888-KINDNESS</span>
            </div>
          </div>

        </div>

        {/* Copyright summary */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 KindnessMap – Bản Đồ Việc Tốt. Tất cả các quyền được bảo lưu.</p>
          <div className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 mx-1 animate-pulse" />
            <span>for active citizens in Vietnam.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
