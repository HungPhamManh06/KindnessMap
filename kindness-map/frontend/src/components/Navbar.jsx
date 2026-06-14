import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { 
  HeartHandshake, Map, BookOpen, Trophy, Shield, PlusCircle, 
  Bell, LogOut, User, ChevronDown, Award, Menu, X, Check, Sparkles 
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout, setActiveModal, quickDemoLogin } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef(null);
  const demoRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.isRead).length);
    } catch (e) {
      console.error('Failed to load notifications');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/all/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark as read');
    }
  };

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setNotifDropdownOpen(false);
      if (demoRef.current && !demoRef.current.contains(event.target)) setDemoDropdownOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium text-sm transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-brand-green to-brand-teal text-white shadow-md shadow-brand-green/20 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3.5 rounded-2xl font-medium text-base transition-all ${
      isActive ? 'bg-brand-green text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo brand */}
          <NavLink to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-green via-brand-teal to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-brand-green/25 group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-deepGreen to-emerald-600 bg-clip-text text-transparent">
                KindnessMap
              </span>
              <span className="text-[11px] font-bold tracking-wide uppercase text-slate-400">
                Bản Đồ Việc Tốt
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            <NavLink to="/explore" className={navLinkClass}>
              <Map className="w-4 h-4" /> Bản Đồ
            </NavLink>
            <NavLink to="/stories" className={navLinkClass}>
              <BookOpen className="w-4 h-4" /> Câu Chuyện
            </NavLink>
            <NavLink to="/leaderboard" className={navLinkClass}>
              <Trophy className="w-4 h-4" /> Bảng Xếp Hạng
            </NavLink>
            <NavLink to="/awards" className={navLinkClass}>
              <Award className="w-4 h-4" /> Giải Thưởng
            </NavLink>

            {isAuthenticated && user?.role === 'admin' && (
              <NavLink to="/admin" className={navLinkClass}>
                <Shield className="w-4 h-4" /> Quản Trị Admin
              </NavLink>
            )}
          </nav>

          {/* Action Tools Center */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* Quick Demo Switcher */}
            <div className="relative" ref={demoRef}>
              <button
                onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:opacity-95 transition-all"
                title="Chuyển nhanh các tài khoản người dùng mẫu"
              >
                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Thử Vai Trò Demo</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {demoDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 py-2 z-50 animate-fade-in divide-y divide-slate-100">
                  <div className="px-4 py-2">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Chuyển Tài Khoản Thử Nghiệm</p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug">Trải nghiệm ngay các tính năng theo vai trò mà không cần đăng nhập thủ công.</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { quickDemoLogin('volunteer'); setDemoDropdownOpen(false); }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-slate-50 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2 text-slate-800">
                        <User className="w-4 h-4 text-brand-green" /> 1. Người Dùng / TNV
                      </div>
                      <span className="text-[10px] py-0.5 px-2 bg-emerald-100 text-emerald-700 rounded-full font-bold">520 Điểm</span>
                    </button>
                    <button
                      onClick={() => { quickDemoLogin('admin'); setDemoDropdownOpen(false); }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-slate-50 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2 text-slate-800">
                        <Shield className="w-4 h-4 text-purple-600" /> 2. Quản Trị Viên (Admin)
                      </div>
                      <span className="text-[10px] py-0.5 px-2 bg-purple-100 text-purple-700 rounded-full font-bold">Quản Trị</span>
                    </button>
                  </div>
                  <div className="py-1 px-4">
                    <button
                      onClick={() => { logout(); setDemoDropdownOpen(false); }}
                      className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 text-center"
                    >
                      Trở thành Khách (Guest)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Post Kindness Button */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setActiveModal('login');
                } else {
                  navigate('/submit');
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-deepGreen via-brand-green to-emerald-500 text-white font-bold text-sm shadow-md shadow-brand-green/30 hover:scale-105 active:scale-95 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Gửi Việc Tốt</span>
            </button>

            {/* Auth section */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="relative p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 z-50 animate-fade-in divide-y divide-slate-100 max-h-[480px] flex flex-col">
                      <div className="px-4 py-2 flex items-center justify-between shrink-0">
                        <h4 className="font-bold text-sm text-slate-800">Thông báo của bạn</h4>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs font-semibold text-brand-green hover:underline flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Đã đọc tất cả
                          </button>
                        )}
                      </div>

                      <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            Không có thông báo nào.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-3.5 transition-colors ${notif.isRead ? 'bg-white opacity-70' : 'bg-brand-lightGreen/50 font-medium'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(notif.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl hover:bg-slate-100 border border-slate-100 transition-all text-left"
                  >
                    <img src={user.avatar} alt={user.fullName} className="w-9 h-9 rounded-xl object-cover bg-slate-200" />
                    <div className="hidden xl:flex flex-col">
                      <span className="font-bold text-xs text-slate-800 leading-none">{user.fullName}</span>
                      <span className="text-[10px] font-semibold text-brand-green mt-1 leading-none">{user.level}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-50 animate-fade-in divide-y divide-slate-100">
                      <div className="px-3 py-2.5">
                        <p className="font-extrabold text-sm text-slate-900">{user.fullName}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600">Tổng điểm:</span>
                          <span className="text-xs font-extrabold text-white bg-gradient-to-r from-brand-green to-brand-teal px-2.5 py-0.5 rounded-full shadow-xs">
                            {user.points} pts
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => { navigate('/profile'); setProfileDropdownOpen(false); }}
                          className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                        >
                          <User className="w-4 h-4 text-brand-blue" /> Hồ sơ & Thành tựu
                        </button>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => { logout(); setProfileDropdownOpen(false); }}
                          className="w-full px-3 py-2 text-left rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" /> Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModal('login')}
                  className="px-4 py-2.5 rounded-2xl text-slate-700 hover:text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors"
                >
                  Đăng Nhập
                </button>
                <button
                  onClick={() => setActiveModal('register')}
                  className="px-4 py-2.5 rounded-2xl bg-brand-lightGreen border border-brand-green text-brand-deepGreen font-bold text-sm hover:bg-brand-green hover:text-white transition-all shadow-xs"
                >
                  Đăng Ký
                </button>
              </div>
            )}

          </div>

          {/* Mobile menu Toggle button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => {
                if (!isAuthenticated) setActiveModal('login');
                else navigate('/submit');
              }}
              className="p-2.5 rounded-2xl bg-brand-green text-white font-bold shadow-md shadow-brand-green/20"
              title="Gửi Việc Tốt"
            >
              <PlusCircle className="w-5 h-5" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-2xl text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-20 bg-white border-b border-slate-200 shadow-2xl px-4 py-6 z-50 animate-fade-in flex flex-col gap-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
          
          {/* Quick Demo Switcher Mobile */}
          <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-600 animate-spin" /> Trải Nghiệm Nhanh Demo
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => { quickDemoLogin('volunteer'); setMobileMenuOpen(false); }}
                className="py-2.5 px-3 rounded-2xl bg-white border border-amber-300 text-xs font-bold text-slate-800 shadow-xs flex items-center justify-center gap-1.5"
              >
                <User className="w-4 h-4 text-brand-green" /> User / TNV
              </button>
              <button
                onClick={() => { quickDemoLogin('admin'); setMobileMenuOpen(false); }}
                className="py-2.5 px-3 rounded-2xl bg-white border border-amber-300 text-xs font-bold text-slate-800 shadow-xs flex items-center justify-center gap-1.5"
              >
                <Shield className="w-4 h-4 text-purple-600" /> Admin
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <NavLink to="/explore" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
              <Map className="w-5 h-5" /> Explore Map
            </NavLink>
            <NavLink to="/stories" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
              <BookOpen className="w-5 h-5" /> Kindness Stories
            </NavLink>
            <NavLink to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
              <Trophy className="w-5 h-5" /> Leaderboard
            </NavLink>
            <NavLink to="/awards" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
              <Award className="w-5 h-5" /> Community Awards
            </NavLink>

            {isAuthenticated && user?.role === 'admin' && (
              <NavLink to="/admin" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                <Shield className="w-5 h-5" /> Admin Moderation
              </NavLink>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            {isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                  className="w-full py-3 px-4 bg-slate-100 rounded-2xl font-bold text-sm text-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} className="w-7 h-7 rounded-lg object-cover" />
                    <span>Hồ sơ cá nhân</span>
                  </div>
                  <span className="text-xs bg-brand-green text-white py-0.5 px-2.5 rounded-full font-extrabold">{user.points} pts</span>
                </button>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setActiveModal('login'); setMobileMenuOpen(false); }}
                  className="py-3.5 rounded-2xl bg-slate-100 text-slate-800 font-bold text-sm"
                >
                  Đăng Nhập
                </button>
                <button
                  onClick={() => { setActiveModal('register'); setMobileMenuOpen(false); }}
                  className="py-3.5 rounded-2xl bg-brand-green text-white font-bold text-sm shadow-lg shadow-brand-green/20"
                >
                  Đăng Ký
                </button>
              </div>
            )}
          </div>

        </div>
      )}
    </header>
  );
};
