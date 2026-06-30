import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  MapPin,
  Send,
  HelpCircle,
  ArrowLeft,
  LocateFixed,
} from 'lucide-react';

const LazyLocationPicker = lazy(() =>
  import('../components/SubmitLocationPicker').then((module) => ({ default: module.SubmitLocationPicker }))
);

const pickerSkeleton = (
  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse">
    <div className="text-center px-6 py-4">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Đang tải bản đồ chọn vị trí...</p>
    </div>
  </div>
);

export const SubmitKindness = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setActiveModal } = useAuth();
  const { addToast } = useNotification();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Môi trường');
  const [locationName, setLocationName] = useState('Hà Nội, Việt Nam');
  const [pickedLatLng, setPickedLatLng] = useState([21.0285, 105.8402]);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successPost, setSuccessPost] = useState(null);
  const [enablePicker, setEnablePicker] = useState(false);

  const categories = ['Môi trường', 'Người cao tuổi', 'Trồng cây', 'Hiến máu', 'Giáo dục', 'Tình nguyện', 'Cộng đồng'];

  const imageTemplates = [
    { name: 'Dọn rác / Môi trường', url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80' },
    { name: 'Trồng cây xanh', url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80' },
    { name: 'Hiến máu nhân đạo', url: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80' },
    { name: 'Chăm sóc người già', url: 'https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=800&q=80' },
    { name: 'Dạy học / Trẻ em', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80' },
    { name: 'Phát quà / Tình nguyện', url: 'https://images.unsplash.com/photo-1593113598432-846f29edce7b?auto=format&fit=crop&w=800&q=80' },
  ];

  const inappropriateKeywords = ['chửi', 'đánh', 'lừa đảo', 'giết', 'bạo lực', 'tệ nạn', 'spam', 'khốn', 'mẹ', 'fuck', 'hate'];

  useEffect(() => {
    const timer = window.setTimeout(() => setEnablePicker(true), 200);
    return () => window.clearTimeout(timer);
  }, []);

  const modCheck = useMemo(() => {
    const text = `${title} ${description}`.toLowerCase();
    const kw = inappropriateKeywords.find((item) => text.includes(item));
    return kw ? { isClean: false, kw } : { isClean: true };
  }, [title, description]);

  const validateForm = () => {
    if (!title.trim() || title.trim().length < 8) {
      addToast('Thiếu tiêu đề', 'Tiêu đề nên có ít nhất 8 ký tự.', 'warning');
      return false;
    }
    if (!description.trim() || description.trim().length < 30) {
      addToast('Mô tả quá ngắn', 'Hãy mô tả rõ việc tốt, người tham gia và tác động cộng đồng.', 'warning');
      return false;
    }
    if (!locationName.trim()) {
      addToast('Thiếu địa điểm', 'Vui lòng nhập tên địa điểm diễn ra việc tốt.', 'warning');
      return false;
    }
    if (!Number.isFinite(Number(pickedLatLng[0])) || !Number.isFinite(Number(pickedLatLng[1]))) {
      addToast('Tọa độ không hợp lệ', 'Vui lòng chọn lại vị trí trên bản đồ.', 'warning');
      return false;
    }
    return true;
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      addToast('Không hỗ trợ định vị', 'Trình duyệt của bạn không hỗ trợ Geolocation.', 'warning');
      return;
    }

    addToast('Đang lấy vị trí', 'Vui lòng cho phép trình duyệt truy cập vị trí.', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = [Number(pos.coords.latitude.toFixed(6)), Number(pos.coords.longitude.toFixed(6))];
        setPickedLatLng(next);
        addToast('Đã cập nhật vị trí', 'Bạn có thể bấm trên bản đồ để tinh chỉnh thêm.', 'success');
      },
      () => addToast('Không lấy được vị trí', 'Bạn có thể chọn thủ công bằng cách bấm trên bản đồ.', 'warning'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('File không hợp lệ', 'Vui lòng chọn file ảnh JPG, PNG, WEBP hoặc GIF.', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('Ảnh quá lớn', 'Vui lòng chọn ảnh dưới 5MB.', 'warning');
      return;
    }

    try {
      setUploadingImage(true);
      setImagePreview(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/posts/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      setImageUrl(res.data.imageUrl);
      addToast('Tải ảnh thành công', 'Ảnh đã được lưu vào máy chủ KindnessMap.', 'success');
    } catch (error) {
      addToast('Tải ảnh thất bại', error.response?.data?.message || 'Vui lòng thử lại hoặc dùng URL ảnh.', 'warning');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setActiveModal('login');
      return;
    }
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const res = await api.post('/posts', {
        title: title.trim(),
        description: description.trim(),
        category,
        imageUrl: imageUrl.trim() || imageTemplates[0].url,
        latitude: pickedLatLng[0],
        longitude: pickedLatLng[1],
        locationName: locationName.trim(),
      });

      setSuccessPost(res.data);
      addToast('Gửi câu chuyện thành công!', 'Cảm ơn đóng góp tuyệt vời của bạn.', 'success');
    } catch (error) {
      addToast('Gửi thất bại', error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.', 'warning');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="km-page-modern relative max-w-3xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
        <AlertTriangle className="w-16 h-16 text-amber-500" />
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">Vui Lòng Đăng Nhập</h2>
        <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 max-w-md text-xs leading-relaxed">
          Bạn cần đăng nhập hoặc tạo tài khoản để ghim việc tốt lên Bản Đồ, tích lũy điểm công dân số và nhận huy hiệu thành tựu.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
          <button onClick={() => setActiveModal('login')} className="px-8 py-3.5 bg-brand-green text-white rounded-2xl font-black text-xs shadow-lg shadow-brand-green/20">
            Đăng Nhập Ngay
          </button>
          <button onClick={() => setActiveModal('register')} className="px-8 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl font-black text-xs">
            Tạo Tài Khoản
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="km-page-modern relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 w-fit transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
      </button>

      {successPost ? (
        <div className="km-submit-card p-8 sm:p-12 text-center flex flex-col items-center gap-6 animate-fade-in max-w-2xl mx-auto w-full">
          <div className="w-20 h-20 bg-emerald-100 text-brand-green rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">Ghim Việc Tốt Thành Công!</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              {successPost.post?.status === 'Approved' ? (
                <span>Tuyệt vời! Câu chuyện của bạn đã được hiển thị công khai trên <strong>Bản Đồ Việc Tốt</strong>.</span>
              ) : successPost.post?.status === 'Rejected' ? (
                <span className="text-rose-600 font-semibold">Bài viết của bạn đã bị hệ thống kiểm duyệt tự động chuyển sang trạng thái từ chối do chứa từ khóa nhạy cảm.</span>
              ) : (
                <span>Câu chuyện của bạn đã được đưa vào danh sách chờ và đang được <strong>Admin</strong> kiểm duyệt.</span>
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/70 w-full flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 font-medium">
            <span>Trạng thái bài viết:</span>
            <span className={`px-3 py-1 rounded-full font-black text-xs ${
              successPost.post?.status === 'Approved' ? 'bg-emerald-100 text-brand-green' :
              successPost.post?.status === 'Rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
            }`}>
              {successPost.post?.status === 'Approved' ? '✅ Đã Phê Duyệt' : successPost.post?.status === 'Rejected' ? '🚫 Bị Từ Chối' : '⏳ Đang Chờ Duyệt'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full mt-4">
            <button
              onClick={() => navigate('/explore')}
              className="w-full py-4 bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-brand-green/20 hover:opacity-95 transition-all"
            >
              🗺️ Xem Trên Bản Đồ
            </button>
            <button
              onClick={() => {
                setTitle('');
                setDescription('');
                setLocationName('Hà Nội, Việt Nam');
                setImageUrl('');
                setImagePreview('');
                setSuccessPost(null);
              }}
              className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-extrabold text-xs rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              ✍️ Gửi Thêm Câu Chuyện Khác
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="km-submit-card p-6 sm:p-10 flex flex-col gap-8">
          <div className="flex flex-col gap-2 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="inline-flex items-center gap-2 text-brand-green font-black text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Chia Sẻ Điều Tử Tế Mỗi Ngày
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100">
              Gửi Câu Chuyện Việc Tốt Của Bạn
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Điền thông tin và bấm trực tiếp trên bản đồ để gắn tọa độ chính xác.
            </p>
          </div>

          {!modCheck.isClean && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs leading-relaxed">
                <span className="font-extrabold block text-rose-900">⚠️ Lưu ý Kiểm Duyệt Tự Động:</span>
                Hệ thống phát hiện từ khóa không phù hợp <strong>“{modCheck.kw}”</strong>. Nếu tiếp tục gửi, bài viết có thể bị từ chối hoặc cần admin xem xét kỹ.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Tiêu đề câu chuyện</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Nhóm bạn trẻ dọn rác cuối tuần"
                className="px-4 py-3.5 rounded-2xl km-auth-input text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-400/10 focus:border-emerald-400"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Danh mục</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-3.5 rounded-2xl km-auth-input text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-400/10 focus:border-emerald-400"
              >
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Mô tả chi tiết</label>
            <textarea
              rows="6"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Hãy kể rõ việc tốt đã diễn ra như thế nào, ai tham gia, giúp được ai và tác động tích cực ra sao..."
              className="px-4 py-3.5 rounded-2xl km-input text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green resize-none"
              required
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-brand-green" />
              <h3 className="font-black text-slate-900 dark:text-slate-100">Hình ảnh minh họa</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4 items-stretch">
              <label className="group relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-400/50 bg-emerald-50/70 dark:bg-emerald-500/10 p-5 text-center hover:bg-emerald-100/70 dark:hover:bg-emerald-500/15 transition-all overflow-hidden">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                  className="sr-only"
                />
                <ImageIcon className="w-8 h-8 text-brand-green mb-3" />
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">Tải ảnh thật từ máy</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">JPG, PNG, WEBP, GIF · tối đa 5MB</span>
                {uploadingImage && <span className="mt-3 text-xs font-black text-brand-green">Đang tải ảnh lên...</span>}
              </label>

              {(imagePreview || imageUrl) && (
                <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 min-h-[150px]">
                  <img src={imagePreview || imageUrl} alt="Preview ảnh bài viết" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <input
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setImagePreview(''); }}
              placeholder="Hoặc dán URL hình ảnh"
              className="px-4 py-3.5 rounded-2xl km-auth-input text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-400/10 focus:border-emerald-400"
            />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {imageTemplates.map((img) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => setImageUrl(img.url)}
                  className={`p-2 rounded-2xl border text-left transition-all ${imageUrl === img.url ? 'border-brand-green ring-4 ring-brand-green/10' : 'border-slate-200 dark:border-slate-700 hover:border-brand-green/40'}`}
                >
                  <img src={img.url} alt={img.name} loading="lazy" decoding="async" className="w-full h-20 object-cover rounded-xl bg-slate-100 dark:bg-slate-800" />
                  <span className="block mt-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 line-clamp-1">{img.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-500" />
                <h3 className="font-black text-slate-900 dark:text-slate-100">Địa điểm & tọa độ</h3>
              </div>
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="px-4 py-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black hover:bg-blue-100 flex items-center justify-center gap-2"
              >
                <LocateFixed className="w-4 h-4" /> Dùng vị trí hiện tại
              </button>
            </div>

            <input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="VD: Hồ Tây, Hà Nội"
              className="px-4 py-3.5 rounded-2xl km-auth-input text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-400/10 focus:border-emerald-400"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="number"
                step="0.000001"
                value={pickedLatLng[0]}
                onChange={(e) => setPickedLatLng([Number(e.target.value), pickedLatLng[1]])}
                className="px-4 py-3 rounded-2xl km-input text-xs font-mono focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green"
                aria-label="Latitude"
              />
              <input
                type="number"
                step="0.000001"
                value={pickedLatLng[1]}
                onChange={(e) => setPickedLatLng([pickedLatLng[0], Number(e.target.value)])}
                className="px-4 py-3 rounded-2xl km-input text-xs font-mono focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green"
                aria-label="Longitude"
              />
            </div>

            <div className="h-80 w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md relative bg-slate-100 dark:bg-slate-800">
              <div className="absolute top-2 left-2 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black text-brand-green shadow-sm">
                💡 Bấm trực tiếp vào bản đồ để gắn tọa độ
              </div>
              {enablePicker ? (
                <Suspense fallback={pickerSkeleton}>
                  <LazyLocationPicker position={pickedLatLng} setPosition={setPickedLatLng} />
                </Suspense>
              ) : (
                pickerSkeleton
              )}
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Tọa độ càng chính xác thì câu chuyện càng dễ được admin xác minh và ghim lên bản đồ cộng đồng.</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-brand-green disabled:bg-slate-300 disabled:text-slate-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-brand-green/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? <>Đang gửi câu chuyện...</> : <><Send className="w-5 h-5" /> Gửi Câu Chuyện Việc Tốt</>}
          </button>
        </form>
      )}
    </div>
  );
};

export default SubmitKindness;
