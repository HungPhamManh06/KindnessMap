import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { ThemeToggle } from './ThemeToggle';
import {
  HeartHandshake,
  Map,
  BookOpen,
  Trophy,
  Shield,
  PlusCircle,
  Bell,
  LogOut,
  User,
  ChevronDown,
  Award,
  Menu,
  X,
  Check,
  Sparkles,
  Target,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout, setActiveModal, quickDemoLogin } =
    useAuth();
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
      if (notifRef.current && !notifRef.current.contains(event.target))
        setNotifDropdownOpen(false);
      if (demoRef.current && !demoRef.current.contains(event.target))
        setDemoDropdownOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target))
        setProfileDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-2 py-2 rounded-2xl font-bold text-[13px] whitespace-nowrap transition-all duration-300 ${
      isActive
        ? 'bg-brand-green/10 text-brand-deepGreen dark:text-brand-green'
        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-base whitespace-nowrap transition-all ${
      isActive
        ? 'bg-brand-green text-white'
        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-center h-20 gap-4">
          {/* Logo brand */}
          <NavLink to="/" className="flex items-center gap-3 min-w-0 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-green via-brand-teal to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-brand-green/20 group-hover:scale-105 transition-transform duration-300">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-brand-deepGreen to-emerald-600 bg-clip-text text-transparent leading-none">
                KindnessMap
              </span>
              <span className="text-[10px] font-extrabold tracking-[0.05em] uppercase text-slate-400 dark:text-slate-500 mt-1">
                Bản Đồ Việc Tốt
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center gap-0 flex-nowrap min-w-0 px-2">
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
            <NavLink to="/matching" className={navLinkClass}>
              <Target className="w-4 h-4" /> AI Ghép Nối
            </NavLink>
          </nav>

          {/* Right side: Action Tools + Mobile Toggle */}
          <div className="flex items-center justify-end gap-2 min-w-0">
            {/* Action Tools Center */}
            <div className="hidden md:flex items-center gap-1.5 flex-nowrap">
              {/* Admin Badge/Link if Admin */}
              {isAuthenticated && user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-brand-green text-white font-bold text-[13px] whitespace-nowrap shadow-lg shadow-brand-green/25 hover:opacity-90 transition-all"
                >
                  <Shield className="w-4 h-4" /> Quản Trị Admin
                </NavLink>
              )}

              {/* Quick Demo Switcher */}
              <div className="relative" ref={demoRef}>
                <button
                  onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-amber-500 text-white font-bold text-[13px] whitespace-nowrap shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all"
                  title="Chuyển nhanh các tài khoản người dùng mẫu"
                >
                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                  <span className="hidden xl:inline">Thử Vai Trò Demo</span>
                  <span className="xl:hidden">Demo</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </button>

                {demoDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 py-3 z-50 animate-fade-in overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 mb-2">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Chế độ Demo
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                        Chuyển vai trò trải nghiệm nhanh
                      </p>
                    </div>
                    <div className="px-2 space-y-1">
                      <button
                        onClick={() => {
                          quickDemoLogin('volunteer');
                          setDemoDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            1. Người Dùng
                          </span>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-black">
                          520 pts
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          quickDemoLogin('admin');
                          setDemoDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-500/10 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600">
                            <Shield className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            2. Admin
                          </span>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-black">
                          Quản trị
                        </span>
                      </button>
                    </div>
                    <div className="mt-2 pt-2 px-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          logout();
                          setDemoDropdownOpen(false);
                        }}
                        className="w-full py-3 rounded-2xl text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-50 dark:bg-slate-800/50 text-center transition-colors"
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
                  if (!isAuthenticated) setActiveModal('login');
                  else navigate('/submit');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-brand-deepGreen to-brand-green text-white font-bold text-[13px] whitespace-nowrap shadow-lg shadow-brand-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Gửi Việc Tốt</span>
              </button>

              {/* Auth section */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2 ml-1">
                  {/* Notification Bell */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                      className="relative p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-950 animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {notifDropdownOpen && (
                      <div className="absolute right-0 mt-3 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 py-4 z-50 animate-fade-in divide-y divide-slate-100 dark:divide-slate-800 max-h-[480px] flex flex-col overflow-hidden">
                        <div className="px-6 py-2 flex items-center justify-between shrink-0 mb-2">
                          <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                            Thông báo
                          </h4>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-[11px] font-bold text-brand-green hover:text-brand-deepGreen transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Đã xem hết
                            </button>
                          )}
                        </div>

                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                          {notifications.length === 0 ? (
                            <div className="p-10 text-center">
                              <Bell className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                              <p className="text-xs font-bold text-slate-400">
                                Bạn chưa có thông báo mới nào
                              </p>
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={`px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${notif.isRead ? 'opacity-60' : 'bg-emerald-50/30 dark:bg-emerald-500/5'}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span
                                    className={`text-xs font-bold ${notif.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}
                                  >
                                    {notif.title}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">
                                    {new Date(
                                      notif.createdAt
                                    ).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                  {notif.message}
                                </p>
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
                      onClick={() =>
                        setProfileDropdownOpen(!profileDropdownOpen)
                      }
                      className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 transition-all"
                    >
                      <div className="relative">
                        <img
                          src={user.avatar}
                          alt={user.fullName}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-slate-900 shadow-sm"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-green border-2 border-white dark:border-slate-950 rounded-full"></div>
                      </div>
                      <div className="hidden xl:flex flex-col text-left pr-1 max-w-[100px]">
                        <span className="font-bold text-[13px] text-slate-800 dark:text-slate-100 leading-tight whitespace-nowrap truncate">
                          {user.fullName}
                        </span>
                        <span className="text-[10px] font-black text-brand-green uppercase tracking-wider whitespace-nowrap truncate">
                          {user.level}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 mr-1" />
                    </button>

                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-3 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-50 animate-fade-in overflow-hidden">
                        <div className="px-4 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl mb-2 text-center">
                          <img
                            src={user.avatar}
                            className="w-16 h-16 rounded-2xl mx-auto mb-3 object-cover shadow-lg"
                            alt=""
                          />
                          <p className="font-black text-sm text-slate-900 dark:text-white">
                            {user.fullName}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            {user.email}
                          </p>
                          <div className="mt-3 flex items-center justify-center gap-2">
                            <span className="text-[10px] font-black text-white bg-brand-green px-3 py-1 rounded-full uppercase tracking-tighter">
                              {user.points} Points
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              navigate('/profile');
                              setProfileDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left rounded-2xl text-[12px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-3 transition-colors"
                          >
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600">
                              <User className="w-4 h-4" />
                            </div>
                            Trang cá nhân
                          </button>
                          <ThemeToggle dropdown />
                          <button
                            onClick={() => {
                              logout();
                              setProfileDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left rounded-2xl text-[12px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-3 transition-colors"
                          >
                            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600">
                              <LogOut className="w-4 h-4" />
                            </div>
                            Đăng xuất
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
                    className="px-5 py-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-[13px] whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                  >
                    Đăng Nhập
                  </button>
                  <button
                    onClick={() => setActiveModal('register')}
                    className="px-6 py-2.5 rounded-2xl bg-brand-lightGreen border-2 border-brand-green text-brand-deepGreen font-black text-[13px] whitespace-nowrap hover:bg-brand-green hover:text-white transition-all shadow-sm"
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
                className="p-2.5 rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-2xl px-4 py-6 z-50 animate-fade-in flex flex-col gap-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
          {/* Quick Demo Switcher Mobile */}
          <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-600 animate-spin" /> Trải
              Nghiệm Nhanh Demo
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => {
                  quickDemoLogin('volunteer');
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 px-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs flex items-center justify-center gap-1.5"
              >
                <User className="w-4 h-4 text-brand-green" /> User / TNV
              </button>
              <button
                onClick={() => {
                  quickDemoLogin('admin');
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 px-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs flex items-center justify-center gap-1.5"
              >
                <Shield className="w-4 h-4 text-purple-600" /> Admin
              </button>
            </div>
          </div>

          {!isAuthenticated && <ThemeToggle mobile />}

          <div className="flex flex-col gap-1">
            <NavLink
              to="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <Map className="w-5 h-5" /> Explore Map
            </NavLink>
            <NavLink
              to="/stories"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <BookOpen className="w-5 h-5" /> Kindness Stories
            </NavLink>
            <NavLink
              to="/leaderboard"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <Trophy className="w-5 h-5" /> Leaderboard
            </NavLink>
            <NavLink
              to="/awards"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <Award className="w-5 h-5" /> Community Awards
            </NavLink>
            <NavLink
              to="/matching"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <Target className="w-5 h-5" /> AI Ghép Nối
            </NavLink>

            {isAuthenticated && user?.role === 'admin' && (
              <NavLink
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Shield className="w-5 h-5" /> Admin Moderation
              </NavLink>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
            {isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <span>Hồ sơ cá nhân</span>
                  </div>
                  <span className="text-xs bg-brand-green text-white py-0.5 px-2.5 rounded-full font-extrabold">
                    {user.points} pts
                  </span>
                </button>
                <ThemeToggle mobile />
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setActiveModal('login');
                    setMobileMenuOpen(false);
                  }}
                  className="py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm"
                >
                  Đăng Nhập
                </button>
                <button
                  onClick={() => {
                    setActiveModal('register');
                    setMobileMenuOpen(false);
                  }}
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
