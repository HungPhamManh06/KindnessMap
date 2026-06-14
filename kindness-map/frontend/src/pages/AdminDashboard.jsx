import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  Shield, Users, FileText, BarChart3, AlertTriangle, 
  Check, X, Star, RefreshCw, Trophy, Sparkles, Award, MapPin 
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user, quickDemoLogin } = useAuth();
  const { addToast } = useNotification();

  const [activeTab, setActiveTab] = useState('moderation'); // 'moderation' | 'users' | 'analytics' | 'awards'
  const [loading, setLoading] = useState(true);

  // Moderation Post Data
  const [modStatusFilter, setModStatusFilter] = useState('Pending'); // 'All' | 'Pending' | 'Approved' | 'Rejected'
  const [posts, setPosts] = useState([]);

  // Users Data
  const [usersList, setUsersList] = useState([]);

  // Analytics Data
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
    }
  }, [activeTab, modStatusFilter, user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'moderation') {
        const res = await api.get('/admin/posts', { params: { status: modStatusFilter } });
        setPosts(res.data);
      } else if (activeTab === 'users') {
        const res = await api.get('/admin/users');
        setUsersList(res.data);
      } else if (activeTab === 'analytics') {
        const res = await api.get('/admin/analytics');
        setAnalytics(res.data);
      }
    } catch (error) {
      console.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleModeratePost = async (postId, newStatus, isFeatured = false) => {
    try {
      await api.put(`/admin/posts/${postId}/moderate`, { status: newStatus, isFeatured });
      addToast('Đã xử lý bài viết!', `Trạng thái mới: ${newStatus}`, 'success');
      // refresh
      setPosts((prev) => prev.filter((p) => p.id !== postId || modStatusFilter === 'All'));
    } catch (error) {
      addToast('Lỗi xử lý', 'Vui lòng thử lại.', 'warning');
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      addToast('Cập nhật quyền thành công!', `Tài khoản giờ là: ${newRole.toUpperCase()}`, 'success');
      setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (error) {
      addToast('Lỗi phân quyền', 'Không thể thực hiện.', 'warning');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-6 animate-fade-in">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shadow-xl">
          <Shield className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900">Khu Vực Quản Trị Hệ Thống (Admin Panel)</h2>
        <p className="text-slate-600 max-w-md text-xs leading-relaxed">
          Quyền truy cập bị từ chối. Trang này chỉ dành cho tài khoản <strong>Quản trị viên (Admin)</strong> có thẩm quyền phê duyệt bài đăng và quản lý điểm số.
        </p>

        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col items-center gap-3 w-full max-w-md">
          <span className="flex items-center gap-2 text-xs font-black text-amber-900 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-600" /> Demo Admin Switcher:
          </span>
          <p className="text-xs text-slate-700">Bạn muốn trải nghiệm tính năng Quản trị ngay bây giờ?</p>
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
            Hệ Thống Kiểm Duyệt & Vận Hành Bền Vững
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Chào {user.fullName}! Kiểm duyệt bài đăng việc tốt, quản lý thành viên, điều phối giải thưởng và theo dõi dữ liệu tổng quan.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 font-bold text-xs transition-colors flex items-center gap-2 shrink-0 backdrop-blur-md self-center md:self-end"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm Mới Trạng Thái</span>
        </button>
      </div>

      {/* 2. Admin Module Dashboard Navigation Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`p-6 rounded-3xl border transition-all text-left flex flex-col gap-3 ${
            activeTab === 'moderation' ? 'bg-gradient-to-br from-brand-lightGreen to-emerald-100/50 border-brand-green shadow-lg ring-4 ring-brand-green/20' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-green text-white flex items-center justify-center shadow-md">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900">1. Duyệt Bài Việc Tốt</h4>
            <p className="text-xs text-slate-500 mt-0.5">Hàng chờ chờ phê duyệt & ghim bản đồ</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`p-6 rounded-3xl border transition-all text-left flex flex-col gap-3 ${
            activeTab === 'users' ? 'bg-gradient-to-br from-purple-50 to-indigo-100/50 border-purple-600 shadow-lg ring-4 ring-purple-600/20' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900">2. Quản Lý Thành Viên</h4>
            <p className="text-xs text-slate-500 mt-0.5">Phân quyền, cấp độ & kiểm tra danh sách</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`p-6 rounded-3xl border transition-all text-left flex flex-col gap-3 ${
            activeTab === 'analytics' ? 'bg-gradient-to-br from-blue-50 to-sky-100/50 border-blue-600 shadow-lg ring-4 ring-blue-600/20' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900">3. Số Liệu Tổng Quan</h4>
            <p className="text-xs text-slate-500 mt-0.5">Thống kê điểm số & đồ thị hoạt động</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('awards')}
          className={`p-6 rounded-3xl border transition-all text-left flex flex-col gap-3 ${
            activeTab === 'awards' ? 'bg-gradient-to-br from-amber-50 to-yellow-100/50 border-amber-500 shadow-lg ring-4 ring-amber-500/20' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900">4. Giải Thưởng Tháng</h4>
            <p className="text-xs text-slate-500 mt-0.5">Quản lý quỹ điểm thưởng & vinh danh</p>
          </div>
        </button>
      </div>

      {/* 3. Module 1: Post Moderation Suite */}
      {activeTab === 'moderation' && (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 flex flex-col gap-6 animate-fade-in">
          
          {/* Internal queue filter Switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>Hàng Chờ Kiểm Duyệt Câu Chuyện</span>
            </h2>

            <div className="flex items-center gap-2">
              {['Pending', 'Approved', 'Rejected', 'All'].map((status) => (
                <button
                  key={status}
                  onClick={() => setModStatusFilter(status)}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
                    modStatusFilter === status ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {status === 'Pending' ? '⏳ Chờ Duyệt' : status === 'Approved' ? '✅ Đã Duyệt' : status === 'Rejected' ? '🚫 Bị Từ Chối' : '🌟 Tất Cả'}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Grid */}
          <div className="flex flex-col gap-6">
            {loading ? (
              <div className="p-16 text-center text-slate-400 font-bold text-xs animate-pulse">
                Đang tải danh sách bài viết...
              </div>
            ) : posts.length === 0 ? (
              <div className="p-16 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-200">
                Không có bài viết nào trong danh sách này.
              </div>
            ) : (
              posts.map((p) => (
                <div
                  key={p.id}
                  className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row items-start justify-between gap-6 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <img src={p.imageUrl} alt={p.title} className="w-32 h-32 rounded-2xl object-cover shrink-0 shadow-xs" />
                    
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-brand-lightGreen text-brand-deepGreen text-[10px] font-black uppercase border border-brand-green/20">
                          {p.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold">
                          📍 {p.locationName}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-slate-900 mt-1.5 leading-snug">
                        {p.title}
                      </h3>
                      
                      <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                        {p.description}
                      </p>

                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200/60 text-xs font-semibold text-slate-500">
                        <span>✍️ {p.authorName}</span>
                        <span>✉️ {p.authorEmail}</span>
                        <span>📅 {new Date(p.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions right bar */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between w-full lg:w-48 gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-200 shrink-0">
                    <span className={`px-3 py-1 rounded-full font-black text-xs ${
                      p.status === 'Approved' ? 'bg-emerald-100 text-brand-green' :
                      p.status === 'Rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.status === 'Approved' ? '✅ Đã Phê Duyệt' :
                       p.status === 'Rejected' ? '🚫 Đã Từ Chối' : '⏳ Chờ Quyết Định'}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {p.status !== 'Approved' && (
                        <button
                          onClick={() => handleModeratePost(p.id, 'Approved')}
                          className="px-4 py-2.5 bg-brand-green text-white rounded-xl font-bold text-xs flex items-center gap-1 hover:opacity-95 shadow-sm"
                          title="Duyệt bài và cộng điểm cho tác giả"
                        >
                          <Check className="w-4 h-4" /> Duyệt & Ghim Map
                        </button>
                      )}

                      {p.status !== 'Rejected' && (
                        <button
                          onClick={() => handleModeratePost(p.id, 'Rejected')}
                          className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs flex items-center gap-1 border border-rose-200 transition-colors"
                          title="Từ chối bài viết"
                        >
                          <X className="w-4 h-4" /> Từ Chối
                        </button>
                      )}

                      {p.status === 'Approved' && (
                        <button
                          onClick={() => handleModeratePost(p.id, 'Approved', p.isFeatured === 0)}
                          className={`px-3 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1 transition-all ${
                            p.isFeatured === 1 ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" /> {p.isFeatured === 1 ? 'Đã Nổi Bật' : 'Lên Nổi Bật'}
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* 4. Module 2: User Management Suite */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 flex flex-col gap-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>Danh Sách Người Dùng Trong Hệ Thống ({usersList.length})</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">Cấp quyền Quản trị viên (Admin) hoặc theo dõi thành tựu</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black text-slate-600 uppercase">
                  <th className="p-4 rounded-l-2xl">ID</th>
                  <th className="p-4">Thành Viên</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Danh Hiệu Level</th>
                  <th className="p-4 text-center">Việc Tốt</th>
                  <th className="p-4 text-center">Tổng Điểm</th>
                  <th className="p-4">Vai Trò Quyền</th>
                  <th className="p-4 text-right rounded-r-2xl">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-500">#{u.id}</td>
                    <td className="p-4 flex items-center gap-3">
                      <img src={u.avatar} alt={u.fullName} className="w-9 h-9 rounded-full object-cover bg-slate-200" />
                      <span className="font-extrabold text-slate-900 text-sm">{u.fullName}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-500">{u.email}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-brand-lightGreen text-brand-deepGreen font-black text-[11px] rounded-full">
                        {u.level}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-700">{u.postsCount} bài</td>
                    <td className="p-4 text-center font-black text-brand-green">{u.points} pts</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role === 'admin' ? 'Quản Trị' : 'Người Dùng'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {u.email !== 'admin@kindnessmap.vn' && (
                        <button
                          onClick={() => handleToggleRole(u.id, u.role)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-colors border ${
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
        </div>
      )}

      {/* 5. Module 3: Analytics Suite */}
      {activeTab === 'analytics' && analytics && (
        <div className="flex flex-col gap-8 animate-fade-in">
          
          {/* Counters Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Tổng Thành Viên</span>
                <span className="text-4xl font-black text-slate-900 mt-1">{analytics.totalUsers}</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-md">
                <Users className="w-8 h-8" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Việc Tốt Phê Duyệt</span>
                <span className="text-4xl font-black text-slate-900 mt-1">{analytics.totalPosts}</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-brand-green flex items-center justify-center shadow-md">
                <FileText className="w-8 h-8" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Quỹ Điểm Đã Cấp</span>
                <span className="text-4xl font-black text-slate-900 mt-1">{analytics.totalPoints} pts</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-md">
                <Trophy className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Activity Charts & Hotspots Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Chart Simulation */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 shadow-xl border border-slate-200 flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-blue" />
                  <span>Biểu Đồ Tăng Trưởng Việc Tốt & Điểm Cộng Đồng (6 Tháng Qua)</span>
                </h3>
              </div>

              <div className="flex items-end gap-4 h-64 px-4 pt-8 pb-4 bg-slate-50 rounded-2xl border border-slate-200/60 justify-between">
                {analytics.monthlyActivity?.map((ma, idx) => {
                  const maxHeight = 1600;
                  const heightPercent = `${(ma.points / maxHeight) * 100}%`;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-black text-brand-deepGreen opacity-0 group-hover:opacity-100 transition-opacity">
                        +{ma.posts} bài
                      </span>
                      <div className="w-full max-w-[40px] bg-gradient-to-t from-brand-green to-brand-teal rounded-t-xl transition-all group-hover:opacity-90 shadow-sm" style={{ height: heightPercent }} />
                      <span className="text-[10px] font-bold text-slate-500 mt-1 text-center truncate w-full">
                        {ma.month}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 text-xs text-slate-500 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-brand-green rounded-full inline-block" /> Quỹ điểm tích lũy hàng tháng
                </span>
              </div>
            </div>

            {/* Active Locations Hotspots */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-8 shadow-xl border border-slate-200 flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  <span>Khu Vực Có Nhiều Việc Tốt Nhất</span>
                </h3>
              </div>

              <div className="flex flex-col gap-4 divide-y divide-slate-100">
                {analytics.activeLocations?.map((al, idx) => (
                  <div key={idx} className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-extrabold text-xs text-slate-800">{al.locationName}</span>
                    </div>
                    <span className="text-xs font-black px-3 py-1 bg-emerald-50 text-brand-green rounded-full border border-brand-green/20">
                      {al.deedsCount} việc tốt
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 6. Module 4: Extra Feature Community Awards Showcase */}
      {activeTab === 'awards' && (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 flex flex-col gap-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              <span>Quản Lý & Trao Tặng Giải Thưởng Cộng Đồng Hàng Tháng</span>
            </h2>
            <span className="text-xs text-brand-green font-bold bg-brand-lightGreen px-3 py-1 rounded-full border border-brand-green/20">
              🌟 Tự động vinh danh 2 phần thưởng mẫu
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col gap-2 relative z-10">
                <span className="px-3 py-1 rounded-full bg-black/20 text-xs font-black w-fit">Tháng 5, 2026</span>
                <h3 className="text-2xl font-black tracking-tight mt-2">Hiệp Sĩ Môi Trường Của Tháng</h3>
                <p className="text-xs leading-relaxed text-amber-100">
                  Trao tặng cho Trần Minh Tuấn với chuỗi 4 dự án làm sạch cảnh quan đô thị và truyền cảm hứng mạnh mẽ cho sinh viên Hà Nội.
                </p>
              </div>

              <div className="pt-4 border-t border-white/20 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" className="w-10 h-10 rounded-full object-cover border-2 border-white" />
                  <span className="font-extrabold text-xs">Trần Minh Tuấn</span>
                </div>
                <span className="px-3 py-1 bg-white text-amber-600 rounded-full font-black text-xs shadow-md">+200 Điểm Thưởng</span>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-tr from-rose-500 to-red-400 text-white shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col gap-2 relative z-10">
                <span className="px-3 py-1 rounded-full bg-black/20 text-xs font-black w-fit">Tháng 4, 2026</span>
                <h3 className="text-2xl font-black tracking-tight mt-2">Đại Sứ Trái Tim Vàng</h3>
                <p className="text-xs leading-relaxed text-rose-100">
                  Trao tặng cho Lê Hoàng Yến vì những nỗ lực không mệt mỏi trong các chiến dịch vận động hiến máu và hỗ trợ bệnh nhân.
                </p>
              </div>

              <div className="pt-4 border-t border-white/20 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" className="w-10 h-10 rounded-full object-cover border-2 border-white" />
                  <span className="font-extrabold text-xs">Lê Hoàng Yến</span>
                </div>
                <span className="px-3 py-1 bg-white text-rose-600 rounded-full font-black text-xs shadow-md">+200 Điểm Thưởng</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
