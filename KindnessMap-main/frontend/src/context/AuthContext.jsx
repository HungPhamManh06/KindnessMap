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
      // DB là nguồn dữ liệu duy nhất và chính xác — không dùng localStorage để override
      const freshUser = res.data.user;
      
      setUser(freshUser);
      setUserBadges(res.data.badges || getFallbackBadges(freshUser.role, freshUser.level));
      setUserPosts(res.data.posts || []);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('fetchUserData error:', error);
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        // Token hết hạn/không hợp lệ: đăng xuất để tránh trạng thái "đăng nhập ảo"
        localStorage.removeItem('kindness_token');
        setUser(null);
        setUserBadges([]);
        setUserPosts([]);
        setIsAuthenticated(false);
      }
      // Nếu chỉ mất mạng (không có response), giữ trạng thái cũ không logout
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Lắng nghe sự kiện phiên hết hạn từ interceptor của axios (api.js)
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setUserBadges([]);
      setUserPosts([]);
      setIsAuthenticated(false);
      addToast('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại để tiếp tục.', 'warning');
      setActiveModal('login');
    };

    window.addEventListener('kindnessmap:session-expired', handleSessionExpired);
    return () => window.removeEventListener('kindnessmap:session-expired', handleSessionExpired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const loggedUser = res.data.user;
      
      localStorage.setItem('kindness_token', res.data.token);
      
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

  const register = async (fullName, email, password) => {
    try {
      const res = await api.post('/auth/register', { fullName, email, password });
      const newUser = res.data.user;

      localStorage.setItem('kindness_token', res.data.token);

      setUser(newUser);
      setIsAuthenticated(true);
      await fetchUserData();

      window.dispatchEvent(new Event('kindnessmap:stats-updated'));
      addToast('Đăng ký thành công!', 'Bạn đã được tặng ngay +10 điểm công dân số khởi đầu.', 'success');
      setActiveModal(null);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký tài khoản.';
      addToast('Đăng ký thất bại', msg, 'warning');
      return { success: false, message: msg };
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      const devNote = res.data.devMode
        ? ' (Server chưa cấu hình SMTP: mã được in ra console backend.)'
        : '';
      addToast('Đã gửi mã xác nhận', `${res.data.message}${devNote}`, 'success');
      return { success: true, devMode: Boolean(res.data.devMode) };
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể gửi mã xác nhận. Vui lòng thử lại.';
      addToast('Thất bại', msg, 'warning');
      return { success: false, message: msg };
    }
  };

  const resetPassword = async (email, code, newPassword) => {
    try {
      const res = await api.post('/auth/reset-password', { email, code, newPassword });
      addToast('Thành công!', res.data.message, 'success');
      setActiveModal('login');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể đặt lại mật khẩu.';
      addToast('Thất bại', msg, 'warning');
      return { success: false, message: msg };
    }
  };

  const loginWithFacebook = useCallback(async (accessToken) => {
    try {
      const res = await api.post('/auth/facebook', { accessToken });
      const loggedUser = res.data.user;

      localStorage.setItem('kindness_token', res.data.token);

      setUser(loggedUser);
      setIsAuthenticated(true);
      await fetchUserData();

      addToast('Đăng nhập Facebook thành công!', `Chào mừng ${loggedUser.fullName} đến với KindnessMap.`, 'success');
      setActiveModal(null);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể đăng nhập bằng Facebook. Vui lòng thử lại!';
      return { success: false, message: msg };
    }
  }, [fetchUserData, addToast]);

  const loginWithGoogle = useCallback(async (credential) => {
    try {
      const res = await api.post('/auth/google', { credential });
      const loggedUser = res.data.user;

      localStorage.setItem('kindness_token', res.data.token);

      setUser(loggedUser);
      setIsAuthenticated(true);
      await fetchUserData();

      addToast('Đăng nhập Google thành công!', `Chào mừng ${loggedUser.fullName} đến với KindnessMap.`, 'success');
      setActiveModal(null);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể đăng nhập bằng Google. Vui lòng thử lại!';
      // Chỉ trả về lỗi — AuthModals hiển thị inline error, tránh toast trùng
      return { success: false, message: msg };
    }
  }, [fetchUserData, addToast]);

  const logout = useCallback(() => {
    localStorage.removeItem('kindness_token');
    setUser(null);
    setUserBadges([]);
    setUserPosts([]);
    setIsAuthenticated(false);
    addToast('Đã đăng xuất', 'Hẹn gặp lại bạn lần sau!', 'info');
  }, [addToast]);

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
        requestPasswordReset,
        resetPassword,
        loginWithGoogle,
        loginWithFacebook,
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
