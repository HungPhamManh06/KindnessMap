import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { BadgeIcon } from '../components/BadgeIcon';
import { 
  User, Mail, Trophy, Star, Clock, MapPin, Edit3, 
  CheckCircle2, AlertTriangle, PlusCircle, ArrowRight, Shield, Award, UploadCloud, Link, Sparkles 
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
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Vui lòng đăng nhập để xem thông tin cá nhân.</h2>
      </div>
    );
  }

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('⚠️ Tệp không hợp lệ', 'Vui lòng chọn file hình ảnh (.JPG hoặc .PNG).', 'warning');
      return;
    }

    addToast('⚡ Đang xử lý hình ảnh...', 'Tối ưu hóa dung lượng hình ảnh.', 'info');

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 120;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;
        
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const microBase64 = canvas.toDataURL('image/jpeg', 0.65);
        
        setAvatar(microBase64);
        addToast('🎉 Tải ảnh thành công!', 'Hãy bấm Lưu Thay Đổi để cập nhật.', 'success');
      };
      img.onerror = () => {
        addToast('⚠️ Lỗi hình ảnh', 'Không thể giải mã tệp này, vui lòng chọn bức ảnh JPG/PNG khác.', 'warning');
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await api.put('/auth/profile', { fullName, avatar });
      // Cập nhật token mới (chứa avatar/fullName mới) vào localStorage
      if (res.data.token) {
        localStorage.setItem('kindness_token', res.data.token);
      }
      
      // Tải lại dữ liệu user từ DB — đây là nguồn sự thật duy nhất
      await fetchUserData();
      setEditModalOpen(false);
      addToast('✨ Cập nhật thành công!', 'Avatar và tên của bạn đã được lưu vào Database và sẽ hiển thị ở mọi trình duyệt.', 'success');
    } catch (error) {
      console.error('Update profile error:', error);
      addToast('Không thể cập nhật', error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.', 'warning');
    } finally {
      setSaving(false);
    }
  };

  const presetAvatars = [
    { label: '👨 Mẫu 1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' },
    { label: '👩 Mẫu 2', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80' },
    { label: '🧑 Mẫu 3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
    { label: '👧 Mẫu 4', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      
      <div className="km-panel-hero p-8 sm:p-12 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-brand-green/10 via-emerald-500/10 to-brand-blue/10 dark:from-brand-green/15 dark:via-emerald-500/10 dark:to-cyan-500/10 pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-12 w-52 h-52 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="relative group">
            <img src={user.avatar} alt={user.fullName} className="w-28 h-28 rounded-3xl object-cover bg-slate-100 dark:bg-slate-800 border-4 border-brand-green/20 shadow-md" />
            <button
              onClick={() => { setFullName(user.fullName); setAvatar(user.avatar); setEditModalOpen(true); }}
              className="absolute bottom-2 right-2 p-2 bg-white dark:bg-slate-900 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-brand-green transition-colors"
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

            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">{user.fullName}</h1>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{user.email}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Tham gia từ: {new Date(user.createdAt || Date.now()).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        <div className="relative z-10 km-panel-soft p-6 flex-1 max-w-md w-full flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">Điểm Việc Tốt</span>
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{user.points} pts</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span>Mốc tiếp theo: {progressInfo.nextLevel}</span>
              <span>{Math.round(progressInfo.progressPercent)}%</span>
            </div>
            <div className="w-full h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-brand-green to-brand-teal rounded-full transition-all duration-1000 shadow-xs"
                style={{ width: `${progressInfo.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      <div className="km-panel p-8 sm:p-10 flex flex-col gap-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-6 h-6 text-brand-green" />
            <span>Bộ Sưu Tập Huy Hiệu Của Bạn ({userBadges.length})</span>
          </h2>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Hoàn thành các hoạt động khác nhau để mở khóa</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {userBadges.length === 0 ? (
            <div className="col-span-4 p-12 text-center text-slate-400 dark:text-slate-500 font-medium text-xs">
              Bạn chưa có huy hiệu nào. Hãy đăng bài việc tốt đầu tiên để nhận ngay huy hiệu!
            </div>
          ) : (
            userBadges.map((ub) => (
              <div
                key={ub.id}
                className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 flex items-start gap-4 transition-all hover:scale-[1.02] duration-200 group hover:border-brand-green hover:bg-brand-lightGreen/20 dark:hover:bg-emerald-500/10"
              >
                <BadgeIcon name={ub.name} className="w-8 h-8" />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 group-hover:text-brand-green transition-colors leading-snug">
                    {ub.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {ub.description}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-2">
                    Đạt được: {new Date(ub.awardedAt || Date.now()).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="km-panel p-8 sm:p-10 flex flex-col gap-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
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
            <div className="p-16 text-center text-slate-400 dark:text-slate-500 font-medium text-xs bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700">
              Bạn chưa gửi câu chuyện việc tốt nào. Hãy ghim dấu ấn đầu tiên của bạn ngay!
            </div>
          ) : (
            userPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => { if (post.status === 'Approved') navigate(`/stories?id=${post.id}`); }}
                className={`p-6 rounded-3xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
                  post.status === 'Approved'
                    ? 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 hover:shadow-lg cursor-pointer'
                    : post.status === 'Rejected'
                      ? 'bg-rose-50/60 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/15'
                      : 'bg-amber-50/60 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/15'
                }`}
              >
                <div className="flex items-start gap-4">
                  <img src={post.imageUrl} alt={post.title} className="w-24 h-24 rounded-2xl object-cover shrink-0 shadow-xs ring-1 ring-black/5 dark:ring-white/5" />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-[10px] font-black uppercase">
                        {post.category}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        📍 {post.locationName} • {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mt-1.5 leading-snug line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {post.description}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 dark:border-slate-700 shrink-0">
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

      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="km-modal-shell max-w-md w-full p-8 flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-green" /> Cập Nhật Hồ Sơ Bọc Thép
            </h3>

            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 dark:text-slate-400 mb-1">Họ và tên hiển thị</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 dark:text-slate-400">Ảnh đại diện (Avatar)</label>
                
                <div className="flex items-center gap-4 p-3 bg-slate-50/80 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/70">
                  <img 
                    src={avatar} 
                    alt="Preview" 
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-green shrink-0 bg-slate-200 dark:bg-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">Xem trước hình ảnh</span>
                    <span className="text-[10px] text-brand-green block font-semibold truncate">
                      Lưu trữ trực tiếp vĩnh cửu
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-1">
                  <label className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 bg-brand-lightGreen border-2 border-dashed border-brand-green text-brand-deepGreen font-black text-xs rounded-2xl cursor-pointer hover:bg-brand-green hover:text-white transition-all shadow-xs group">
                    <UploadCloud className="w-5 h-5 group-hover:scale-125 transition-transform text-brand-green group-hover:text-white" />
                    <span>📥 Bấm Chọn Ảnh Từ Thư Viện (JPG/PNG)</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden"
                    />
                  </label>

                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hoặc bấm chọn nhanh 4 mẫu cực xịn:</span>
                    <div className="grid grid-cols-4 gap-2">
                      {presetAvatars.map((pa, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(pa.url)}
                          className="py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold hover:bg-brand-green hover:text-white transition-colors bg-slate-50 dark:bg-slate-800/70"
                        >
                          {pa.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative mt-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Hoặc chép link trực tiếp (URL / Base64):</span>
                    <div className="relative">
                      <Link className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-green truncate"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-brand-green text-white font-black text-xs shadow-md hover:opacity-95"
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
