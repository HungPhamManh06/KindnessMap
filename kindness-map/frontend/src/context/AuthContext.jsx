import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNotification } from './NotificationContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState(null);
  const { addToast } = useNotification();

  const getFallbackBadges = (role, level) => {
    if (role === 'admin') {
      return [
        { id: 1, name: 'Environmental Guardian', description: 'Người gác đền môi trường, tích cực làm sạch tự nhiên.', awardedAt: '2026-05-10' },
        { id: 2, name: 'Kindness Ambassador', description: 'Đại sứ việc tốt, truyền cảm hứng mạnh mẽ.', awardedAt: '2026-05-15' },
        { id: 3, name: 'Blood Donation Hero', description: 'Anh hùng hiến máu cứu người.', awardedAt: '2026-06-01' },
        { id: 4, name: 'Social Impact Maker', description: 'Người tạo tác động xã hội bền vững.', awardedAt: '2026-06-10' }
      ];
    }
    return [
      { id: 1, name: 'Environmental Guardian', description: 'Người gác đền môi trường, tích cực làm sạch tự nhiên.', awardedAt: '2026-05-20' },
      { id: 2, name: 'Community Volunteer', description: 'Tình nguyện viên cống hiến vì cộng đồng.', awardedAt: '2026-06-05' }
    ];
  };

  // BROADCAST CHANNEL: Lắng nghe và đồng bộ tức thì các Tab Web đang mở
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'kindness_user' && e.newValue) {
        try {
          const freshObj = JSON.parse(e.newValue);
          setUser(freshObj);
          setIsAuthenticated(true);
        } catch (err) { console.error(err); }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem('kindness_token');
    if (!token) {
      setUser(null);
      setUserBadges([]);
      setUserPosts([]);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      const freshUser = res.data.user;
      
      setUser(freshUser);
      setUserBadges(res.data.badges || getFallbackBadges(freshUser.role, freshUser.level));
      setUserPosts(res.data.posts || []);
      setIsAuthenticated(true);
      
      localStorage.setItem('kindness_user', JSON.stringify(freshUser));
    } catch (error) {
      const cached = localStorage.getItem('kindness_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        setUser(parsed);
        setIsAuthenticated(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const loggedUser = res.data.user;
      
      localStorage.setItem('kindness_token', res.data.token);
      localStorage.setItem('kindness_user', JSON.stringify(loggedUser));
      
      setUser(loggedUser);
      setIsAuthenticated(true);
      await fetchUserData();
      
      addToast('Đăng nhập thành công!', `Chào mừng ${loggedUser.fullName} trở lại Bản Đồ Việc Tốt.`, 'success');
      setActiveModal(null);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập. Vui lòng kiểm tra lại thông tin!';
      addToast('Đăng nhập thất bại', msg, 'warning');
      return { success: false, message: msg };
    }
  };

  const register = async (fullName, email, password, role = 'user') => {
    try {
      const res = await api.post('/auth/register', { fullName, email, password, role });
      const newUser = res.data.user;

      localStorage.setItem('kindness_token', res.data.token);
      localStorage.setItem('kindness_user', JSON.stringify(newUser));

      setUser(newUser);
      setIsAuthenticated(true);
      await fetchUserData();

      addToast('Đăng ký thành công!', 'Bạn đã được tặng ngay +10 điểm công dân số khởi đầu.', 'success');
      setActiveModal(null);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký tài khoản.';
      addToast('Đăng ký thất bại', msg, 'warning');
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('kindness_token');
    localStorage.removeItem('kindness_user');
    setUser(null);
    setUserBadges([]);
    setUserPosts([]);
    setIsAuthenticated(false);
    addToast('Đã đăng xuất', 'Hẹn gặp lại bạn lần sau!', 'info');
  };

  const resetPassword = async (email, newPassword) => {
    try {
      const res = await api.post('/auth/reset-password', { email, newPassword });
      addToast('Thành công!', res.data.message, 'success');
      setActiveModal('login');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể đặt lại mật khẩu.';
      addToast('Thất bại', msg, 'warning');
      return { success: false, message: msg };
    }
  };

  const quickDemoLogin = async (demoRole) => {
    let demoEmail = 'tuan.tran@student.vn';
    let demoPw = 'password123';
    
    if (demoRole === 'admin') {
      demoEmail = 'admin@kindnessmap.vn';
    } else if (demoRole === 'volunteer') {
      demoEmail = 'hoangyen.volunteer@gmail.com';
    }

    addToast('🔄 Đang chuyển tài khoản demo...', `Kết nối định tuyến ${demoRole.toUpperCase()}`, 'info');
    await login(demoEmail, demoPw);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userBadges,
        userPosts,
        isAuthenticated,
        loading,
        activeModal,
        setActiveModal,
        login,
        register,
        logout,
        resetPassword,
        fetchUserData,
        quickDemoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
