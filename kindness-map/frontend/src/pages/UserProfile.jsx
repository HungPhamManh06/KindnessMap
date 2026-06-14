import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { BadgeIcon } from '../components/BadgeIcon';
import { 
  User, Mail, Trophy, Star, Clock, MapPin, Edit3, 
  CheckCircle2, AlertTriangle, PlusCircle, ArrowRight, Shield, Award 
} from 'lucide-react';

export const UserProfile = () => {
  const navigate = useNavigate();
  const { user, userBadges, userPosts, fetchUserData } = useAuth();
  const { addToast } = useNotification();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Vui lòng đăng nhập để xem thông tin cá nhân.</h2>
      </div>
    );
  }

  // Calculate Level progress helper
  const calculateLevelProgress = () => {
    let currentLevel = user.level;
    let nextLevel = 'Kindness Ambassador';
    let minPts = 0;
    let maxPts = 100;

    if (user.points > 500) {
      currentLevel = 'Community Hero';
      nextLevel = 'Max Level';
      minPts = 500;
      maxPts = 1000;
    } else if (user.points > 300) {
      currentLevel = 'Community Inspiration';
      nextLevel = 'Community Hero (500 pts)';
      minPts = 301;
      maxPts = 500;
    } else if (user.points > 100) {
      currentLevel = 'Kindness Ambassador';
      nextLevel = 'Community Inspiration (300 pts)';
      minPts = 101;
      maxPts = 300;
    } else {
      currentLevel = 'Active Citizen';
      nextLevel = 'Kindness Ambassador (100 pts)';
      minPts = 0;
      maxPts = 100;
    }

    const progressPercent = Math.min(
      100,
      Math.max(0, ((user.points - minPts) / (maxPts - minPts)) * 100)
    );

    return { currentLevel, nextLevel, progressPercent, maxPts };
  };

  const progressInfo = calculateLevelProgress();

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/auth/profile', { fullName, avatar });
      if (res.data.token) {
        localStorage.setItem('kindness_token', res.data.token);
      }
      await fetchUserData();
      setEditModalOpen(false);
      addToast('Cập nhật thành công!', 'Hồ sơ của bạn đã được thay đổi.', 'success');
    } catch (error) {
      addToast('Không thể cập nhật', 'Vui lòng thử lại sau.', 'warning');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      
      {/* 1. User Header & Level Progress Banner */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/90 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 relative overflow-hidden">
        
        {/* Left ID Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="relative group">
            <img src={user.avatar} alt={user.fullName} className="w-28 h-28 rounded-3xl object-cover bg-slate-100 border-4 border-brand-green/20 shadow-md" />
            <button
              onClick={() => { setFullName(user.fullName); setAvatar(user.avatar); setEditModalOpen(true); }}
              className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg border border-slate-200 text-slate-700 hover:text-brand-green transition-colors"
              title="Sửa thông tin"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 bg-brand-lightGreen text-brand-deepGreen font-black text-xs rounded-full uppercase tracking-wider border border-brand-green/30">
                {user.level}
              </span>
              {user.role === 'admin' && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 font-black text-xs rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Quản Trị Viên
                </span>
              )}
            </div>

            <h1 className="text-3xl font-black text-slate-900 mt-1">{user.fullName}</h1>
            <p className="text-xs font-mono text-slate-500">{user.email}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Tham gia từ: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Right Level Tracker Box */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex-1 max-w-md w-full flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="font-extrabold text-xs text-slate-800">Điểm Việc Tốt</span>
            </div>
            <span className="text-2xl font-black text-slate-900">{user.points} pts</span>
          </div>

          {/* Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Mốc tiếp theo: {progressInfo.nextLevel}</span>
              <span>{Math.round(progressInfo.progressPercent)}%</span>
            </div>
            <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-brand-green to-brand-teal rounded-full transition-all duration-1000 shadow-xs"
                style={{ width: `${progressInfo.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* 2. Earned Achievement Badges Gallery */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200 flex flex-col gap-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-brand-green" />
            <span>Bộ Sưu Tập Huy Hiệu Của Bạn ({userBadges.length})</span>
          </h2>
          <span className="text-xs font-semibold text-slate-400">Hoàn thành các hoạt động khác nhau để mở khóa</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {userBadges.length === 0 ? (
            <div className="col-span-4 p-12 text-center text-slate-400 font-medium text-xs">
              Bạn chưa có huy hiệu nào. Hãy đăng bài việc tốt đầu tiên để nhận ngay huy hiệu!
            </div>
          ) : (
            userBadges.map((ub) => (
              <div
                key={ub.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-4 transition-all hover:scale-105 duration-200 group hover:border-brand-green hover:bg-brand-lightGreen/20"
              >
                <BadgeIcon name={ub.name} className="w-8 h-8" />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-brand-green transition-colors leading-snug">
                    {ub.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {ub.description}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium mt-2">
                    Đạt được: {new Date(ub.awardedAt || Date.now()).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Submitted Kindness Posts History */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200 flex flex-col gap-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-blue" />
            <span>Lịch Sử Bài Viết Việc Tốt ({userPosts.length})</span>
          </h2>
          <button
            onClick={() => navigate('/submit')}
            className="px-5 py-2.5 rounded-xl bg-brand-green text-white font-black text-xs flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Đăng Bài Mới
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {userPosts.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-medium text-xs bg-slate-50 rounded-2xl border border-slate-200">
              Bạn chưa gửi câu chuyện việc tốt nào. Hãy ghim dấu ấn đầu tiên của bạn ngay!
            </div>
          ) : (
            userPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => { if (post.status === 'Approved') navigate(`/stories?id=${post.id}`); }}
                className={`p-6 rounded-3xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
                  post.status === 'Approved' ? 'bg-white border-slate-200 hover:shadow-lg cursor-pointer' :
                  post.status === 'Rejected' ? 'bg-rose-50/50 border-rose-200' : 'bg-amber-50/50 border-amber-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <img src={post.imageUrl} alt={post.title} className="w-24 h-24 rounded-2xl object-cover shrink-0 shadow-xs" />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black uppercase">
                        {post.category}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        📍 {post.locationName} • {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 mt-1.5 leading-snug line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {post.description}
                    </p>
                  </div>
                </div>

                {/* Status tag */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 shrink-0">
                  <span className={`px-3.5 py-1.5 rounded-full font-black text-xs ${
                    post.status === 'Approved' ? 'bg-emerald-100 text-brand-green' :
                    post.status === 'Rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {post.status === 'Approved' ? '✅ Đã Duyệt' :
                     post.status === 'Rejected' ? '🚫 Từ Chối' : '⏳ Chờ Duyệt'}
                  </span>

                  {post.status === 'Approved' && (
                    <span className="text-[11px] font-bold text-brand-blue flex items-center gap-1 hover:underline mt-1">
                      Xem chi tiết <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Profile Popup Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 flex flex-col gap-6 relative">
            <h3 className="text-xl font-black text-slate-900">Sửa Thông Tin Hồ Sơ</h3>

            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Họ và tên hiển thị</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ảnh đại diện (Avatar URL)</label>
                <input
                  type="url"
                  required
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-brand-green text-white font-extrabold text-xs shadow-md"
                >
                  {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
