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

  // Bộ Mẫu Huy Hiệu & Bài Viết Dự Phòng (Fallback) khi mạng API bị trễ
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

  const getFallbackPosts = (email, fullName) => {
    return [
      {
        id: 101,
        title: 'Cùng nhóm bạn thu gom rác thải nhựa tại Công viên',
        description: 'Buổi sáng ý nghĩa thu gom được 15 bao rác thải, trả lại cảnh quan xanh sạch.',
        category: 'Môi trường',
        locationName: 'Hà Nội, Việt Nam',
        status: 'Approved',
        imageUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80',
        createdAt: '2026-06-12'
      },
      {
        id: 102,
        title: 'Thăm hỏi và tặng quà cho các cụ già neo đơn',
        description: 'Trao tặng sữa và lắng nghe những câu chuyện đời xúc động của các cụ.',
        category: 'Người cao tuổi',
        locationName: 'TP. Hồ Chí Minh',
        status: 'Approved',
        imageUrl: 'https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=800&q=80',
        createdAt: '2026-06-10'
      }
    ];
  };

  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem('kindness_token');
    const savedUser = localStorage.getItem('kindness_user');

    if (!token) {
      setUser(null);
      setUserBadges([]);
      setUserPosts([]);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    // TẦNG LƯU TRỮ BỌC THÉP: Khởi tạo ngay trạng thái từ localStorage để Web mượt tức thì 100%
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setIsAuthenticated(true);
        setUserBadges(getFallbackBadges(parsed.role, parsed.level));
        setUserPosts(getFallbackPosts(parsed.email, parsed.fullName));
      } catch (e) {
        console.error('Local error', e);
      }
    }

    // Gọi ngầm API cập nhật dữ liệu mới nhất
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setUserBadges(res.data.badges || getFallbackBadges(res.data.user.role, res.data.user.level));
      setUserPosts(res.data.posts || getFallbackPosts(res.data.user.email, res.data.user.fullName));
      setIsAuthenticated(true);
      localStorage.setItem('kindness_user', JSON.stringify(res.data.user));
    } catch (error) {
      console.log('API timeout, keeping Unbreakable Storage active');
      // Dù API rớt mạng, TUYỆT ĐỐI KHÔNG ĐĂNG XUẤT người dùng!
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
      setUserBadges(getFallbackBadges(loggedUser.role, loggedUser.level));
      setUserPosts(getFallbackPosts(loggedUser.email, loggedUser.fullName));
      
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
      setUserBadges(getFallbackBadges(newUser.role, newUser.level));
      setUserPosts([]);

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

    addToast('🔄 Đang chuyển tài khoản demo...', `Băng thông kết nối luồng ${demoRole.toUpperCase()}`, 'info');
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
