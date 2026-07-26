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
  ArrowRight,
  LocateFixed,
  Check,
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

  const [currentStep, setCurrentStep] = useState(1);
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

  const validateStep1 = () => {
    if (!title.trim() || title.trim().length < 8) {
      addToast('Thiếu tiêu đề', 'Tiêu đề nên có ít nhất 8 ký tự.', 'warning');
      return false;
    }
    if (!description.trim() || description.trim().length < 30) {
      addToast('Mô tả quá ngắn', 'Hãy mô tả rõ việc tốt, người tham gia và tác động cộng đồng.', 'warning');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    return true; // Image is optional; default template will be used if empty
  };

  const validateStep3 = () => {
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

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
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
    if (!validateStep1() || !validateStep3()) return;

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
        <AlertTriangle className="w-14 h-14 text-amber-500" />
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Vui Lòng Đăng Nhập</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md text-xs leading-relaxed">
          Bạn cần đăng nhập để ghim việc tốt lên Bản Đồ và nhận điểm công dân số.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
          <button onClick={() => setActiveModal('login')} className="px-7 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/20">
            Đăng Nhập Ngay
          </button>
          <button onClick={() => setActiveModal('register')} className="px-7 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl font-bold text-xs">
            Tạo Tài Khoản
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="km-page-modern relative max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 w-fit transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
      </button>

      {successPost ? (
        <div className="km-submit-card p-8 sm:p-12 text-center flex flex-col items-center gap-6 animate-fade-in max-w-2xl mx-auto w-full">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Ghim Việc Tốt Thành Công!</h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
              {successPost.post?.status === 'Approved' ? (
                <span>Câu chuyện của bạn đã được hiển thị công khai trên <strong>Bản Đồ Việc Tốt</strong>.</span>
              ) : (
                <span>Câu chuyện của bạn đã được đưa vào danh sách chờ kiểm duyệt.</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/explore')}
              className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
            >
              Xem trên Bản đồ
            </button>
            <button
              onClick={() => {
                setSuccessPost(null);
                setCurrentStep(1);
                setTitle('');
                setDescription('');
                setImageUrl('');
                setImagePreview('');
              }}
              className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-xs"
            >
              Gửi bài viết khác
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="km-submit-card p-6 sm:p-10 flex flex-col gap-8">
          {/* Header & Stepper */}
          <div className="flex flex-col gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Quy trình 3 bước đơn giản
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                Ghim Việc Tốt Của Bạn
              </h1>
            </div>

            {/* Stepper indicator */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { step: 1, label: '1. Nội dung' },
                { step: 2, label: '2. Hình ảnh' },
                { step: 3, label: '3. Định vị' },
              ].map((s) => (
                <div
                  key={s.step}
                  onClick={() => {
                    if (s.step === 1) setCurrentStep(1);
                    else if (s.step === 2 && validateStep1()) setCurrentStep(2);
                    else if (s.step === 3 && validateStep1() && validateStep2()) setCurrentStep(3);
                  }}
                  className={`cursor-pointer px-3 py-2.5 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 ${
                    currentStep === s.step
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-bold text-xs'
                      : currentStep > s.step
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-semibold text-xs'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700 font-medium text-xs'
                  }`}
                >
                  {currentStep > s.step ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: Content & Category */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              {!modCheck.isClean && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs leading-relaxed">
                    <span className="font-bold block">⚠️ Lưu ý nội dung:</span>
                    Hệ thống phát hiện từ khóa không phù hợp <strong>“{modCheck.kw}”</strong>. Nội dung có thể cần kiểm duyệt kỹ trước khi duyệt.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tiêu đề việc tốt</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Nhóm sinh viên dọn sạch rác bờ hồ"
                    className="px-4 py-3 rounded-2xl km-auth-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Danh mục</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-4 py-3 rounded-2xl km-auth-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Mô tả chi tiết</label>
                <textarea
                  rows="6"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Hãy mô tả chi tiết hoạt động: những người tham gia, công việc đã làm và kết quả đạt được..."
                  className="px-4 py-3 rounded-2xl km-auth-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <span>Tiếp tục sang Hình ảnh</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Photo Upload & Templates */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Hình ảnh minh họa</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4 items-stretch">
                <label className="group relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-400/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 text-center hover:bg-emerald-100/50 transition-all">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => handleImageUpload(e.target.files?.[0])}
                    className="sr-only"
                  />
                  <ImageIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Tải ảnh thực tế từ thiết bị</span>
                  <span className="text-[10px] text-slate-500 mt-1">Hỗ trợ JPG, PNG, WEBP · Tối đa 5MB</span>
                  {uploadingImage && <span className="mt-2 text-xs font-bold text-emerald-600">Đang tải ảnh...</span>}
                </label>

                {(imagePreview || imageUrl) && (
                  <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 min-h-[140px]">
                    <img src={imagePreview || imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Hoặc chọn nhanh ảnh mẫu có sẵn:</span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {imageTemplates.map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setImageUrl(img.url)}
                      className={`p-2 rounded-2xl border text-left transition-all ${
                        imageUrl === img.url
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400/50'
                      }`}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-18 object-cover rounded-xl bg-slate-100 dark:bg-slate-800" />
                      <span className="block mt-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">{img.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <span>Tiếp tục sang Định vị</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Location & Confirmation */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Định vị & Xác nhận</h3>
                </div>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="px-4 py-2 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold flex items-center gap-2"
                >
                  <LocateFixed className="w-3.5 h-3.5" /> Dùng vị trí hiện tại
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tên địa điểm</label>
                <input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="VD: Hồ Tây, Hà Nội"
                  className="px-4 py-3 rounded-2xl km-auth-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="h-72 w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative bg-slate-100 dark:bg-slate-800">
                <div className="absolute top-2 left-2 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  💡 Bấm trực tiếp vào bản đồ để chọn tọa độ
                </div>
                {enablePicker ? (
                  <Suspense fallback={pickerSkeleton}>
                    <LazyLocationPicker position={pickedLatLng} setPosition={setPickedLatLng} />
                  </Suspense>
                ) : (
                  pickerSkeleton
                )}
              </div>

              {/* Summary Review Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col gap-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">Xem trước thông tin ghim:</span>
                <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
                  <span>📌 <strong>Tiêu đề:</strong> {title || '(Chưa nhập)'}</span>
                  <span>🏷️ <strong>Mục:</strong> {category}</span>
                  <span>📍 <strong>Vị trí:</strong> {locationName}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-70"
                >
                  {submitting ? (
                    <span>Đang gửi câu chuyện...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi Câu Chuyện Việc Tốt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default SubmitKindness;
