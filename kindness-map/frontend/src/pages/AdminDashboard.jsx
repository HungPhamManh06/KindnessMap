import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Shield, Users, FileText, BarChart3, AlertTriangle,
  Check, X, Star, RefreshCw, Trophy, Sparkles, Award, MapPin,
  Search, Filter, Clock, CheckCircle2, XCircle, Zap, UserCog, Eye
} from 'lucide-react';

const STATUS_CONFIG = {
  Pending: {
    label: 'Chờ duyệt',
    longLabel: '⏳ Chờ Quyết Định',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 dark:border dark:border-amber-500/20',
    icon: Clock
  },
  Approved: {
    label: 'Đã duyệt',
    longLabel: '✅ Đã Phê Duyệt',
    className: 'bg-emerald-100 text-brand-green dark:bg-emerald-500/15 dark:text-emerald-300 dark:border dark:border-emerald-500/20',
    icon: CheckCircle2
  },
  Rejected: {
    label: 'Từ chối',
    longLabel: '🚫 Đã Từ Chối',
    className: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300 dark:border dark:border-rose-500/20',
    icon: XCircle
  },
};

const REJECTION_REASONS = [
  'Thông tin minh chứng chưa đủ rõ ràng',
  'Nội dung chưa phù hợp tiêu chuẩn cộng đồng',
  'Địa điểm hoặc tọa độ chưa chính xác',
  'Hình ảnh chưa liên quan hoặc chất lượng thấp',
  'Bài viết có dấu hiệu trùng lặp/spam',
  'Khác',
];

const getPointForCategory = (category) => {
  switch (category) {
    case 'Môi trường':
    case 'Environment':
      return 10;
    case 'Người cao tuổi':
    case 'Elderly Care':
      return 20;
    case 'Trồng cây':
    case 'Tree Planting':
      return 30;
    case 'Hiến máu':
    case 'Blood Donation':
      return 50;
    default:
      return 25;
  }
};

const formatDate = (date) => new Date(date).toLocaleDateString('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export const AdminDashboard = () => {
  const { user, quickDemoLogin } = useAuth();
  const { addToast } = useNotification();

  const [activeTab, setActiveTab] = useState('moderation');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Moderation Post Data
  const [modStatusFilter, setModStatusFilter] = useState('Pending');
  const [posts, setPosts] = useState([]);
  const [postSearch, setPostSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [postSortBy, setPostSortBy] = useState('newest');
  const [selectedPostIds, setSelectedPostIds] = useState([]);
  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    mode: 'single',
    postId: null,
    postTitle: '',
    reason: REJECTION_REASONS[0],
    details: '',
  });

  // Users Data
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userSortBy, setUserSortBy] = useState('points_desc');

  // Analytics Data
  const [analytics, setAnalytics] = useState(null);
  const [adminSummary, setAdminSummary] = useState(null);

  // Awards Data
  const [awards, setAwards] = useState([]);
  const [awardForm, setAwardForm] = useState({
    title: '',
    month: 'Tháng 6/2026',
    description: '',
    recipientUserId: '',
    awardPoints: 200,
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
    }
  }, [activeTab, modStatusFilter, user]);

  useEffect(() => {
    setSelectedPostIds([]);
  }, [posts, modStatusFilter, postSearch, categoryFilter]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      const summaryRequest = api.get('/admin/analytics').then((res) => {
        setAdminSummary(res.data);
        if (activeTab === 'analytics') setAnalytics(res.data);
      });

      let activeRequest = Promise.resolve();
      if (activeTab === 'moderation') {
        activeRequest = api.get('/admin/posts', { params: { status: modStatusFilter } }).then((res) => setPosts(res.data));
      } else if (activeTab === 'users') {
        activeRequest = api.get('/admin/users').then((res) => setUsersList(res.data));
      } else if (activeTab === 'analytics') {
        activeRequest = summaryRequest;
      } else if (activeTab === 'awards') {
        activeRequest = Promise.all([
          api.get('/admin/awards').then((res) => setAwards(res.data)),
          api.get('/admin/users').then((res) => setUsersList(res.data)),
        ]);
      }

      await Promise.all([summaryRequest, activeRequest]);
    } catch (error) {
      console.error('Failed to load admin data', error);
      addToast('Không tải được dữ liệu Admin', 'Vui lòng kiểm tra API hoặc đăng nhập lại.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleModeratePost = async (postId, newStatus, isFeatured = false, rejectionReason = '') => {
    try {
      setActionLoading(true);
      await api.put(`/admin/posts/${postId}/moderate`, { status: newStatus, isFeatured, rejectionReason });
      addToast('Đã xử lý bài viết!', `Trạng thái mới: ${newStatus}`, 'success');
      await fetchAdminData();
    } catch (error) {
      addToast('Lỗi xử lý', error.response?.data?.message || 'Vui lòng thử lại.', 'warning');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkModerate = async (newStatus, rejectionReason = '') => {
    if (selectedPostIds.length === 0) return;
    const label = newStatus === 'Approved' ? 'duyệt' : 'từ chối';
    const ok = window.confirm(`Bạn chắc chắn muốn ${label} ${selectedPostIds.length} bài viết đã chọn?`);
    if (!ok) return;

    try {
      setActionLoading(true);
      await Promise.all(
        selectedPostIds.map((id) => api.put(`/admin/posts/${id}/moderate`, { status: newStatus, isFeatured: false, rejectionReason }))
      );
      addToast('Xử lý hàng loạt thành công!', `Đã ${label} ${selectedPostIds.length} bài viết.`, 'success');
      setSelectedPostIds([]);
      await fetchAdminData();
    } catch (error) {
      addToast('Lỗi xử lý hàng loạt', error.response?.data?.message || 'Một vài bài viết chưa được cập nhật.', 'warning');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = ({ mode = 'single', post = null } = {}) => {
    setRejectDialog({
      open: true,
      mode,
      postId: post?.id || null,
      postTitle: post?.title || '',
      reason: REJECTION_REASONS[0],
      details: '',
    });
  };

  const closeRejectDialog = () => {
    setRejectDialog((prev) => ({ ...prev, open: false }));
  };

  const buildRejectionReason = () => {
    const reason = rejectDialog.reason === 'Khác' ? '' : rejectDialog.reason;
    const details = rejectDialog.details.trim();
    return [reason, details].filter(Boolean).join('. ');
  };

  const handleConfirmReject = async () => {
    const rejectionReason = buildRejectionReason();
    if (!rejectionReason) {
      addToast('Thiếu lý do từ chối', 'Vui lòng chọn hoặc nhập lý do để người dùng biết cần cải thiện gì.', 'warning');
      return;
    }

    closeRejectDialog();
    if (rejectDialog.mode === 'bulk') {
      await handleBulkModerate('Rejected', rejectionReason);
    } else if (rejectDialog.postId) {
      await handleModeratePost(rejectDialog.postId, 'Rejected', false, rejectionReason);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      setActionLoading(true);
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      addToast('Cập nhật quyền thành công!', `Tài khoản giờ là: ${newRole.toUpperCase()}`, 'success');
      setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (error) {
      addToast('Lỗi phân quyền', 'Không thể thực hiện.', 'warning');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAward = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload = {
        ...awardForm,
        recipientUserId: Number(awardForm.recipientUserId),
        awardPoints: Number(awardForm.awardPoints),
      };
      const res = await api.post('/admin/awards', payload);
      addToast('Đã trao giải thưởng!', res.data.message || 'Người nhận đã được cộng điểm và thông báo.', 'award');
      setAwardForm({ title: '', month: 'Tháng 6/2026', description: '', recipientUserId: '', awardPoints: 200 });
      await fetchAdminData();
    } catch (error) {
      addToast('Lỗi trao giải', error.response?.data?.message || 'Vui lòng kiểm tra dữ liệu nhập.', 'warning');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAward = async (awardId) => {
    const ok = window.confirm('Bạn chắc chắn muốn xóa giải thưởng này khỏi Sảnh vinh danh? Điểm đã cộng cho người nhận sẽ được giữ nguyên.');
    if (!ok) return;

    try {
      setActionLoading(true);
      await api.delete(`/admin/awards/${awardId}`);
      addToast('Đã xóa giải thưởng', 'Giải thưởng đã được gỡ khỏi danh sách vinh danh.', 'success');
      setAwards((prev) => prev.filter((aw) => aw.id !== awardId));
    } catch (error) {
      addToast('Lỗi xóa giải thưởng', error.response?.data?.message || 'Không thể xóa giải thưởng.', 'warning');
    } finally {
      setActionLoading(false);
    }
  };

  const postCategories = useMemo(() => {
    const categories = posts.map((p) => p.category).filter(Boolean);
    return ['All', ...Array.from(new Set(categories))];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const keyword = postSearch.trim().toLowerCase();
    let data = [...posts];

    if (categoryFilter !== 'All') {
      data = data.filter((p) => p.category === categoryFilter);
    }

    if (keyword) {
      data = data.filter((p) =>
        [p.title, p.description, p.locationName, p.authorName, p.authorEmail, p.category]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(keyword))
      );
    }

    data.sort((a, b) => {
      if (postSortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (postSortBy === 'points_desc') return getPointForCategory(b.category) - getPointForCategory(a.category);
      if (postSortBy === 'featured') return Number(b.isFeatured || 0) - Number(a.isFeatured || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return data;
  }, [posts, postSearch, categoryFilter, postSortBy]);

  const filteredUsers = useMemo(() => {
    const keyword = userSearch.trim().toLowerCase();
    let data = [...usersList];

    if (userRoleFilter !== 'All') {
      data = data.filter((u) => u.role === userRoleFilter);
    }

    if (keyword) {
      data = data.filter((u) =>
        [u.fullName, u.email, u.level, u.role]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(keyword))
      );
    }

    data.sort((a, b) => {
      if (userSortBy === 'points_asc') return a.points - b.points;
      if (userSortBy === 'posts_desc') return b.postsCount - a.postsCount;
      if (userSortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      return b.points - a.points;
    });

    return data;
  }, [usersList, userSearch, userRoleFilter, userSortBy]);

  const visibleSelectedCount = selectedPostIds.filter((id) => filteredPosts.some((p) => p.id === id)).length;

  const togglePostSelection = (postId) => {
    setSelectedPostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const toggleSelectAllVisiblePosts = () => {
    const visibleIds = filteredPosts.map((p) => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedPostIds.includes(id));
    setSelectedPostIds((prev) => {
      if (allSelected) return prev.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...prev, ...visibleIds]));
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-6 animate-fade-in">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shadow-xl">
          <Shield className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">Khu Vực Quản Trị Hệ Thống (Admin Panel)</h2>
        <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 max-w-md text-xs leading-relaxed">
          Quyền truy cập bị từ chối. Trang này chỉ dành cho tài khoản <strong>Quản trị viên (Admin)</strong> có thẩm quyền phê duyệt bài đăng và quản lý điểm số.
        </p>

        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col items-center gap-3 w-full max-w-md">
          <span className="flex items-center gap-2 text-xs font-black text-amber-900 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-600" /> Demo Admin Switcher:
          </span>
          <p className="text-xs text-slate-700 dark:text-slate-200">Bạn muốn trải nghiệm tính năng Quản trị ngay bây giờ?</p>
          <button
            onClick={() => quickDemoLogin('admin')}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-purple-500/30 hover:opacity-95 transition-all"
          >
            Chuyển Ngay Sang Tài Khoản Admin Demo
          </button>
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Chờ duyệt', value: adminSummary?.pendingPosts ?? '—', icon: AlertTriangle, className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20' },
    { label: 'Đã duyệt', value: adminSummary?.approvedPosts ?? adminSummary?.totalPosts ?? '—', icon: CheckCircle2, className: 'bg-emerald-50 text-brand-green border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20' },
    { label: 'Bị từ chối', value: adminSummary?.rejectedPosts ?? '—', icon: XCircle, className: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20' },
    { label: 'Thành viên', value: adminSummary?.totalUsers ?? '—', icon: Users, className: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      {/* 1. Admin Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-12 rounded-3xl text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-2 relative z-10 text-center md:text-left">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-extrabold text-xs w-fit self-center md:self-start">
            <Shield className="w-4 h-4" /> Bảng Điều Khiển Quản Trị KindnessMap
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
            Trung Tâm Kiểm Duyệt & Vận Hành Cộng Đồng
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">
            Chào {user.fullName}! Màn hình mới hỗ trợ tìm kiếm, lọc nâng cao, xử lý hàng loạt và thống kê thật từ dữ liệu hệ thống.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading || actionLoading}
          className="px-5 py-3 rounded-2xl bg-white/10 dark:bg-slate-800/50 hover:bg-white/20 dark:hover:bg-slate-700/70 disabled:opacity-60 border border-white/10 font-bold text-xs transition-colors flex items-center gap-2 shrink-0 backdrop-blur-md self-center md:self-end"
        >
          <RefreshCw className={`w-4 h-4 ${loading || actionLoading ? 'animate-spin' : ''}`} />
          <span>Làm Mới Trạng Thái</span>
        </button>
      </div>

      {/* Realtime Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 -mt-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`p-5 rounded-3xl border shadow-sm flex items-center justify-between gap-4 backdrop-blur-sm ${card.className}`}>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider opacity-80">{card.label}</p>
                <p className="text-3xl font-black mt-1">{card.value}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/70 dark:bg-slate-950/60 flex items-center justify-center shadow-sm border border-white/50 dark:border-slate-700/60">
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Admin Module Dashboard Navigation Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`p-6 rounded-3xl border transition-all text-left flex flex-col gap-3 ${
            activeTab === 'moderation' ? 'bg-gradient-to-br from-brand-lightGreen to-emerald-100/50 dark:from-emerald-500/20 dark:to-teal-500/10 border-brand-green shadow-lg ring-4 ring-brand-green/20' : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-green text-white flex items-center justify-center shadow-md">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">1. Duyệt Bài Việc Tốt</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tìm kiếm, lọc và duyệt hàng loạt</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`p-6 rounded-3xl border transition-all text-left flex flex-col gap-3 ${
            activeTab === 'users' ? 'bg-gradient-to-br from-purple-50 to-indigo-100/50 dark:from-purple-500/20 dark:to-indigo-500/10 border-purple-600 shadow-lg ring-4 ring-purple-600/20' : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">2. Quản Lý Thành Viên</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lọc vai trò, tìm email, sắp xếp điểm</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`p-6 rounded-3xl border transition-all text-left flex flex-col gap-3 ${
            activeTab === 'analytics' ? 'bg-gradient-to-br from-blue-50 to-sky-100/50 dark:from-blue-500/20 dark:to-sky-500/10 border-blue-600 shadow-lg ring-4 ring-blue-600/20' : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">3. Số Liệu Tổng Quan</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Biểu đồ thật theo tháng & danh mục</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('awards')}
          className={`p-6 rounded-3xl border transition-all text-left flex flex-col gap-3 ${
            activeTab === 'awards' ? 'bg-gradient-to-br from-amber-50 to-yellow-100/50 dark:from-amber-500/20 dark:to-yellow-500/10 border-amber-500 shadow-lg ring-4 ring-amber-500/20' : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">4. Giải Thưởng Tháng</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Quản lý quỹ điểm thưởng & vinh danh</p>
          </div>
        </button>
      </div>

      {/* 3. Module 1: Post Moderation Suite */}
      {activeTab === 'moderation' && (
        <div className="km-panel p-6 sm:p-8 flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col gap-5 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-brand-green" />
                  Hàng Chờ Kiểm Duyệt Câu Chuyện
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Đang hiển thị {filteredPosts.length}/{posts.length} bài. Chọn nhiều bài để duyệt hoặc từ chối nhanh.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {['Pending', 'Approved', 'Rejected', 'All'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setModStatusFilter(status)}
                    className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
                      modStatusFilter === status ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {status === 'Pending' ? '⏳ Chờ Duyệt' : status === 'Approved' ? '✅ Đã Duyệt' : status === 'Rejected' ? '🚫 Bị Từ Chối' : '🌟 Tất Cả'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  placeholder="Tìm theo tiêu đề, địa điểm, tác giả, email..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green"
                />
              </div>
              <div className="lg:col-span-3 relative">
                <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green"
                >
                  {postCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat === 'All' ? 'Tất cả danh mục' : cat}</option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-2">
                <select
                  value={postSortBy}
                  onChange={(e) => setPostSortBy(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="points_desc">Điểm thưởng cao</option>
                  <option value="featured">Nổi bật trước</option>
                </select>
              </div>
              <button
                onClick={toggleSelectAllVisiblePosts}
                disabled={filteredPosts.length === 0}
                className="lg:col-span-2 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-slate-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white text-xs font-black hover:opacity-90 transition-all"
              >
                {visibleSelectedCount === filteredPosts.length && filteredPosts.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn trang này'}
              </button>
            </div>

            {selectedPostIds.length > 0 && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Đã chọn {selectedPostIds.length} bài viết
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleBulkModerate('Approved')}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-brand-green text-white text-xs font-black hover:opacity-90 disabled:opacity-60"
                  >
                    Duyệt hàng loạt
                  </button>
                  <button
                    onClick={() => openRejectDialog({ mode: 'bulk' })}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-black hover:opacity-90 disabled:opacity-60"
                  >
                    Từ chối hàng loạt
                  </button>
                  <button
                    onClick={() => setSelectedPostIds([])}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {loading ? (
              <div className="p-16 text-center text-slate-400 dark:text-slate-500 font-bold text-xs animate-pulse">
                Đang tải danh sách bài viết...
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="p-16 text-center text-slate-400 dark:text-slate-500 font-bold text-xs bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700">
                Không có bài viết phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              filteredPosts.map((p) => {
                const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.Pending;
                return (
                  <div
                    key={p.id}
                    className={`p-5 sm:p-6 rounded-3xl border bg-slate-50/80 dark:bg-slate-800/60 flex flex-col lg:flex-row items-start justify-between gap-6 hover:shadow-xl transition-all ${
                      selectedPostIds.includes(p.id)
                        ? 'border-indigo-400 ring-4 ring-indigo-100 dark:ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700/70'
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0 w-full">
                      <input
                        type="checkbox"
                        checked={selectedPostIds.includes(p.id)}
                        onChange={() => togglePostSelection(p.id)}
                        className="mt-2 w-4 h-4 accent-indigo-600 shrink-0"
                        aria-label={`Chọn bài ${p.title}`}
                      />
                      <img src={p.imageUrl} alt={p.title} className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shrink-0 shadow-xs bg-slate-200 dark:bg-slate-700" />

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-brand-lightGreen text-brand-deepGreen text-[10px] font-black uppercase border border-brand-green/20">
                            {p.category} · +{getPointForCategory(p.category)} pts
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                            📍 {p.locationName}
                          </span>
                          {Number(p.isFeatured) === 1 && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase border border-amber-200">
                              ⭐ Nổi bật
                            </span>
                          )}
                          {Number(p.pointsAwarded || 0) === 1 && (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase border border-blue-200">
                              💠 Đã cộng điểm
                            </span>
                          )}
                        </div>

                        <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mt-1.5 leading-snug">
                          {p.title}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                          {p.description}
                        </p>

                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
                          <span>✍️ {p.authorName}</span>
                          <span>✉️ {p.authorEmail}</span>
                          <span>📅 {formatDate(p.createdAt)}</span>
                          <span>🧭 {Number(p.latitude).toFixed(4)}, {Number(p.longitude).toFixed(4)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col items-center lg:items-end justify-between w-full lg:w-52 gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-200 dark:border-slate-700 shrink-0">
                      <span className={`px-3 py-1 rounded-full font-black text-xs ${status.className}`}>
                        {status.longLabel}
                      </span>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {p.status !== 'Approved' && (
                          <button
                            onClick={() => handleModeratePost(p.id, 'Approved')}
                            disabled={actionLoading}
                            className="px-4 py-2.5 bg-brand-green text-white rounded-xl font-bold text-xs flex items-center gap-1 hover:opacity-95 shadow-sm disabled:opacity-60"
                            title="Duyệt bài và cộng điểm cho tác giả"
                          >
                            <Check className="w-4 h-4" /> Duyệt
                          </button>
                        )}

                        {p.status !== 'Rejected' && (
                          <button
                            onClick={() => openRejectDialog({ mode: 'single', post: p })}
                            disabled={actionLoading}
                            className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs flex items-center gap-1 border border-rose-200 transition-colors disabled:opacity-60"
                            title="Từ chối bài viết kèm lý do gửi cho tác giả"
                          >
                            <X className="w-4 h-4" /> Từ Chối
                          </button>
                        )}

                        {p.status === 'Approved' && (
                          <button
                            onClick={() => handleModeratePost(p.id, 'Approved', Number(p.isFeatured) !== 1)}
                            disabled={actionLoading}
                            className={`px-3 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1 transition-all disabled:opacity-60 ${
                              Number(p.isFeatured) === 1 ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5 fill-current" /> {Number(p.isFeatured) === 1 ? 'Bỏ Nổi Bật' : 'Nổi Bật'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. Module 2: User Management Suite */}
      {activeTab === 'users' && (
        <div className="km-panel p-6 sm:p-8 flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserCog className="w-6 h-6 text-purple-600" />
                  Danh Sách Người Dùng ({filteredUsers.length}/{usersList.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tìm kiếm, lọc vai trò và sắp xếp để quản trị cộng đồng nhanh hơn.</p>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Không thể hạ quyền tài khoản admin mặc định</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Tìm theo tên, email, danh hiệu..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-purple-600/10 focus:border-purple-600"
                />
              </div>
              <div className="lg:col-span-3">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-purple-600/10 focus:border-purple-600"
                >
                  <option value="All">Tất cả vai trò</option>
                  <option value="admin">Quản trị viên</option>
                  <option value="user">Người dùng</option>
                </select>
              </div>
              <div className="lg:col-span-3">
                <select
                  value={userSortBy}
                  onChange={(e) => setUserSortBy(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-purple-600/10 focus:border-purple-600"
                >
                  <option value="points_desc">Điểm cao nhất</option>
                  <option value="points_asc">Điểm thấp nhất</option>
                  <option value="posts_desc">Nhiều bài nhất</option>
                  <option value="newest">Mới tham gia</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500 font-bold text-xs animate-pulse">
              Đang tải danh sách người dùng...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500 font-bold text-xs bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700">
              Không tìm thấy người dùng phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs font-black text-slate-600 dark:text-slate-300 dark:text-slate-400 uppercase">
                    <th className="p-4 rounded-l-2xl">ID</th>
                    <th className="p-4">Thành Viên</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Danh Hiệu Level</th>
                    <th className="p-4 text-center">Việc Tốt</th>
                    <th className="p-4 text-center">Tổng Điểm</th>
                    <th className="p-4">Vai Trò</th>
                    <th className="p-4 text-right rounded-r-2xl">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="p-4 font-bold text-slate-500 dark:text-slate-400">#{u.id}</td>
                      <td className="p-4 flex items-center gap-3">
                        <img src={u.avatar} alt={u.fullName} className="w-9 h-9 rounded-full object-cover bg-slate-200 dark:bg-slate-700" />
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">{u.fullName}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">Tham gia {formatDate(u.createdAt)}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{u.email}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-brand-lightGreen text-brand-deepGreen font-black text-[11px] rounded-full whitespace-nowrap">
                          {u.level}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-200">{u.postsCount} bài</td>
                      <td className="p-4 text-center font-black text-brand-green">{u.points} pts</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {u.role === 'admin' ? 'Quản Trị' : 'Người Dùng'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {u.email !== 'admin@kindnessmap.vn' && (
                          <button
                            onClick={() => handleToggleRole(u.id, u.role)}
                            disabled={actionLoading}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-colors border disabled:opacity-60 ${
                              u.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                            }`}
                          >
                            {u.role === 'admin' ? 'Hạ Quyền' : 'Lên Admin'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. Module 3: Analytics Suite */}
      {activeTab === 'analytics' && analytics && (
        <div className="flex flex-col gap-8 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider">Tổng Thành Viên</span>
                <span className="text-4xl font-black text-slate-900 dark:text-slate-100 mt-1">{analytics.totalUsers}</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-md">
                <Users className="w-8 h-8" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider">Việc Tốt Phê Duyệt</span>
                <span className="text-4xl font-black text-slate-900 dark:text-slate-100 mt-1">{analytics.totalPosts}</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-brand-green flex items-center justify-center shadow-md">
                <FileText className="w-8 h-8" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider">Quỹ Điểm Đã Cấp</span>
                <span className="text-4xl font-black text-slate-900 dark:text-slate-100 mt-1">{analytics.totalPoints} pts</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-md">
                <Trophy className="w-8 h-8" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider">Cần Xử Lý</span>
                <span className="text-4xl font-black text-slate-900 dark:text-slate-100 mt-1">{analytics.pendingPosts}</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-md">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 km-panel p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-blue" />
                  <span>Tăng Trưởng Việc Tốt & Điểm Cộng Đồng (6 Tháng Gần Nhất)</span>
                </h3>
              </div>

              <div className="flex items-end gap-4 h-64 px-4 pt-8 pb-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/60 justify-between">
                {analytics.monthlyActivity?.map((ma, idx) => {
                  const maxPoints = Math.max(1, ...analytics.monthlyActivity.map((item) => item.points || 0));
                  const heightPercent = `${Math.max(8, ((ma.points || 0) / maxPoints) * 100)}%`;
                  return (
                    <div key={`${ma.month}-${idx}`} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-black text-brand-deepGreen opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {ma.posts} bài · {ma.points} pts
                      </span>
                      <div className="w-full max-w-[44px] bg-gradient-to-t from-brand-green to-brand-teal rounded-t-xl transition-all group-hover:opacity-90 shadow-sm" style={{ height: heightPercent }} />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 text-center truncate w-full">
                        {ma.month}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-brand-green rounded-full inline-block" /> Điểm cộng đồng phát sinh từ bài đã duyệt
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 km-panel p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  <span>Khu Vực Có Nhiều Việc Tốt Nhất</span>
                </h3>
              </div>

              <div className="flex flex-col gap-4 divide-y divide-slate-100">
                {analytics.activeLocations?.length ? analytics.activeLocations.map((al, idx) => (
                  <div key={idx} className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">{al.locationName}</span>
                    </div>
                    <span className="text-xs font-black px-3 py-1 bg-emerald-50 text-brand-green rounded-full border border-brand-green/20">
                      {al.deedsCount} việc tốt
                    </span>
                  </div>
                )) : (
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-bold text-center py-8">Chưa có dữ liệu địa điểm.</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 km-panel p-8 flex flex-col gap-6">
              <h3 className="font-black text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Filter className="w-5 h-5 text-indigo-600" /> Phân Bổ Theo Danh Mục
              </h3>
              <div className="flex flex-col gap-4">
                {analytics.categoryBreakdown?.length ? analytics.categoryBreakdown.map((cat) => {
                  const max = Math.max(1, ...analytics.categoryBreakdown.map((item) => item.postsCount || 0));
                  const percent = Math.max(8, ((cat.postsCount || 0) / max) * 100);
                  return (
                    <div key={cat.category} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="text-slate-700 dark:text-slate-200">{cat.category}</span>
                        <span className="text-brand-green">{cat.postsCount} bài · {cat.pointsPotential} pts</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-brand-teal" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-bold text-center py-8">Chưa có dữ liệu danh mục.</div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 km-panel p-8 flex flex-col gap-6">
              <h3 className="font-black text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Eye className="w-5 h-5 text-amber-600" /> Bài Chờ Duyệt Gần Đây
              </h3>
              <div className="flex flex-col gap-3">
                {analytics.recentPending?.length ? analytics.recentPending.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl bg-amber-50 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/15 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-black text-sm text-slate-900 dark:text-slate-100 truncate">{p.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1">{p.authorName} · {p.category} · {formatDate(p.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('moderation');
                        setModStatusFilter('Pending');
                        setPostSearch(p.title);
                      }}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 text-[11px] font-black hover:bg-amber-100 dark:hover:bg-amber-500/10 shrink-0"
                    >
                      Xem
                    </button>
                  </div>
                )) : (
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-bold text-center py-8">Không còn bài chờ duyệt.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Module 4: Real Community Awards Management */}
      {activeTab === 'awards' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in items-start">
          <div className="lg:col-span-5 km-panel p-6 sm:p-8 flex flex-col gap-6">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-500" />
                Trao Giải Thưởng Tháng
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tạo giải thưởng thật trong database, cộng điểm cho người nhận và gửi thông báo tự động.
              </p>
            </div>

            <form onSubmit={handleCreateAward} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Tên giải thưởng</label>
                <input
                  value={awardForm.title}
                  onChange={(e) => setAwardForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="VD: Hiệp Sĩ Môi Trường Của Tháng"
                  className="mt-2 w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Tháng vinh danh</label>
                  <input
                    value={awardForm.month}
                    onChange={(e) => setAwardForm((prev) => ({ ...prev, month: e.target.value }))}
                    placeholder="Tháng 6/2026"
                    className="mt-2 w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Điểm thưởng</label>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    value={awardForm.awardPoints}
                    onChange={(e) => setAwardForm((prev) => ({ ...prev, awardPoints: e.target.value }))}
                    className="mt-2 w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Người nhận</label>
                <select
                  value={awardForm.recipientUserId}
                  onChange={(e) => setAwardForm((prev) => ({ ...prev, recipientUserId: e.target.value }))}
                  className="mt-2 w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500"
                  required
                >
                  <option value="">Chọn thành viên xứng đáng</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} · {u.points} pts · {u.approvedPostsCount || 0} bài đã duyệt
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Lý do vinh danh</label>
                <textarea
                  rows="5"
                  value={awardForm.description}
                  onChange={(e) => setAwardForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả đóng góp nổi bật, tác động cộng đồng và lý do xứng đáng nhận giải..."
                  className="mt-2 w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black shadow-lg shadow-amber-500/20 hover:opacity-95 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                Trao Giải & Cộng Điểm
              </button>
            </form>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
              <strong>Lưu ý:</strong> Khi trao giải, hệ thống sẽ cộng điểm ngay cho người nhận, kiểm tra thăng hạng và tạo thông báo loại <strong>award</strong>.
              Nếu xóa giải khỏi Sảnh vinh danh, điểm đã cộng vẫn được giữ để tránh làm sai lịch sử điểm của người dùng.
            </div>
          </div>

          <div className="lg:col-span-7 km-panel p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-500" />
                  Sảnh Vinh Danh Đang Công Bố
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Danh sách này cũng hiển thị ở trang “Giải Thưởng Tháng”.</p>
              </div>
              <span className="text-xs text-brand-green font-bold bg-brand-lightGreen px-3 py-1 rounded-full border border-brand-green/20 w-fit">
                {awards.length} giải thưởng
              </span>
            </div>

            {loading ? (
              <div className="p-16 text-center text-slate-400 dark:text-slate-500 font-bold text-xs animate-pulse">
                Đang tải danh sách giải thưởng...
              </div>
            ) : awards.length === 0 ? (
              <div className="p-16 text-center text-slate-400 dark:text-slate-500 font-bold text-xs bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700">
                Chưa có giải thưởng nào. Hãy tạo giải đầu tiên để vinh danh cộng đồng.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {awards.map((aw) => (
                  <div key={aw.id} className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-white dark:from-amber-500/10 dark:to-slate-900 border border-amber-100 dark:border-amber-500/15 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex gap-4 min-w-0">
                        <img src={aw.recipientAvatar} alt={aw.recipientName} className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-300 bg-slate-200 dark:bg-slate-700 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider">
                              🏆 {aw.month}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-brand-green font-black text-[10px] border border-brand-green/20">
                              +{aw.awardPoints} pts
                            </span>
                          </div>
                          <h3 className="font-black text-base text-slate-900 dark:text-slate-100 mt-2">{aw.title}</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400 leading-relaxed mt-1 line-clamp-3">{aw.description}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-3">
                            Người nhận: <strong className="text-slate-800 dark:text-slate-100">{aw.recipientName}</strong> · {aw.recipientEmail} · {aw.recipientLevel}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteAward(aw.id)}
                        disabled={actionLoading}
                        className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-black hover:bg-rose-100 disabled:opacity-60 shrink-0"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {rejectDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg km-modal-shell overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-rose-600 to-red-500 text-white relative">
              <button
                onClick={closeRejectDialog}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 dark:bg-slate-800/50 hover:bg-white/20 dark:bg-slate-800/60 flex items-center justify-center"
                aria-label="Đóng hộp thoại từ chối"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-white/15 dark:bg-slate-800/50 flex items-center justify-center mb-3">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black">
                {rejectDialog.mode === 'bulk' ? `Từ chối ${selectedPostIds.length} bài đã chọn` : 'Từ chối bài viết'}
              </h3>
              <p className="text-xs text-rose-100 mt-1 leading-relaxed">
                {rejectDialog.mode === 'bulk'
                  ? 'Lý do này sẽ được gửi cho tất cả tác giả của các bài viết đã chọn.'
                  : `Tác giả bài “${rejectDialog.postTitle}” sẽ nhận thông báo kèm lý do cụ thể.`}
              </p>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Lý do chính</label>
                <select
                  value={rejectDialog.reason}
                  onChange={(e) => setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))}
                  className="mt-2 w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500"
                >
                  {REJECTION_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Ghi chú bổ sung cho người dùng</label>
                <textarea
                  rows="4"
                  value={rejectDialog.details}
                  onChange={(e) => setRejectDialog((prev) => ({ ...prev, details: e.target.value }))}
                  placeholder="VD: Vui lòng bổ sung ảnh trước/sau hoạt động, mô tả số người tham gia hoặc chọn lại vị trí chính xác trên bản đồ..."
                  className="mt-2 w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 resize-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/15 text-xs text-rose-700 dark:text-rose-200 leading-relaxed">
                <strong>Xem trước thông báo:</strong> Bài viết chưa được duyệt. Lý do: {buildRejectionReason() || '...' }
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={closeRejectDialog}
                  className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={actionLoading}
                  className="px-5 py-3 rounded-2xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 disabled:opacity-60 flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Xác Nhận Từ Chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
