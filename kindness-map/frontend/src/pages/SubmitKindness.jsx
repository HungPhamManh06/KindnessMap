import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { 
  Sparkles, CheckCircle2, AlertTriangle, Image as ImageIcon, 
  MapPin, Send, HelpCircle, ArrowLeft, Plus 
} from 'lucide-react';

// Live map click handler for picking coordinates
const LocationPickerMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
};

export const SubmitKindness = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setActiveModal } = useAuth();
  const { addToast } = useNotification();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Môi trường');
  const [locationName, setLocationName] = useState('Hà Nội, Việt Nam');
  const [pickedLatLng, setPickedLatLng] = useState([21.0285, 105.8402]); // Default Hanoi
  const [imageUrl, setImageUrl] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [successPost, setSuccessPost] = useState(null);

  const categories = ['Môi trường', 'Người cao tuổi', 'Trồng cây', 'Hiến máu', 'Giáo dục', 'Tình nguyện', 'Cộng đồng'];

  // Template placeholders for easy image selection
  const imageTemplates = [
    { name: 'Dọn rác / Môi trường', url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80' },
    { name: 'Trồng cây xanh', url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80' },
    { name: 'Hiến máu nhân đạo', url: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80' },
    { name: 'Chăm sóc người già', url: 'https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=800&q=80' },
    { name: 'Dạy học / Trẻ em', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80' },
    { name: 'Phát quà / Tình nguyện', url: 'https://images.unsplash.com/photo-1593113598432-846f29edce7b?auto=format&fit=crop&w=800&q=80' },
  ];

  // AI Moderation Mockup Live check
  const inappropriateKeywords = ['chửi', 'đánh', 'lừa đảo', 'giết', 'bạo lực', 'tệ nạn', 'spam', 'khốn', 'mẹ', 'fuck', 'hate'];
  const performLiveModeration = () => {
    const text = `${title} ${description}`.toLowerCase();
    for (const kw of inappropriateKeywords) {
      if (text.includes(kw)) {
        return { isClean: false, kw };
      }
    }
    return { isClean: true };
  };

  const modCheck = performLiveModeration();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setActiveModal('login');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/posts', {
        title,
        description,
        category,
        imageUrl: imageUrl || imageTemplates[0].url,
        latitude: pickedLatLng[0],
        longitude: pickedLatLng[1],
        locationName,
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
      <div className="max-w-3xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
        <AlertTriangle className="w-16 h-16 text-amber-500" />
        <h2 className="text-3xl font-black text-slate-900">Vui Lòng Đăng Nhập</h2>
        <p className="text-slate-600 max-w-md text-xs leading-relaxed">
          Bạn cần đăng nhập hoặc tạo tài khoản để có thể ghim việc tốt của mình lên Bản Đồ, tích lũy điểm công dân số và nhận huy hiệu thành tựu.
        </p>
        <div className="flex items-center gap-4 mt-4">
          <button onClick={() => setActiveModal('login')} className="px-8 py-3.5 bg-brand-green text-white rounded-2xl font-black text-xs shadow-lg shadow-brand-green/20">
            Đăng Nhập Ngay
          </button>
          <button onClick={() => setActiveModal('register')} className="px-8 py-3.5 bg-white border border-slate-200 text-slate-800 rounded-2xl font-black text-xs">
            Tạo Tài Khoản
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      
      {/* Top Breadcrumb */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 w-fit transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
      </button>

      {/* Main Success Overlay View */}
      {successPost ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-emerald-100 text-center flex flex-col items-center gap-6 animate-fade-in max-w-2xl mx-auto w-full">
          <div className="w-20 h-20 bg-emerald-100 text-brand-green rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black text-slate-900">Ghim Việc Tốt Thành Công!</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              {successPost.post?.status === 'Approved' ? (
                <span>Tuyệt vời! Câu chuyện của bạn đã được hiển thị công khai trên <strong>Bản Đồ Việc Tốt</strong>. Bạn vừa được cộng điểm công dân số!</span>
              ) : successPost.post?.status === 'Rejected' ? (
                <span className="text-rose-600 font-semibold">Bài viết của bạn đã bị Hệ thống Kiểm duyệt AI tự động chuyển sang trạng thái Từ chối do chứa từ khóa nhạy cảm.</span>
              ) : (
                <span>Câu chuyện của bạn đã được đưa vào danh sách chờ và đang được <strong>Quản trị viên (Admin)</strong> kiểm duyệt. Quá trình này thường diễn ra rất nhanh!</span>
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 w-full flex items-center justify-between text-xs text-slate-700 font-medium">
            <span>Trạng thái bài viết:</span>
            <span className={`px-3 py-1 rounded-full font-black text-xs ${
              successPost.post?.status === 'Approved' ? 'bg-emerald-100 text-brand-green' :
              successPost.post?.status === 'Rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
            }`}>
              {successPost.post?.status === 'Approved' ? '✅ Đã Phê Duyệt' :
               successPost.post?.status === 'Rejected' ? '🚫 Bị Từ Chối' : '⏳ Đang Chờ Duyệt'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full mt-4">
            <button
              onClick={() => navigate('/explore')}
              className="w-full py-4 bg-brand-green text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-brand-green/20 hover:opacity-95 transition-all"
            >
              🗺️ Xem Trên Bản Đồ
            </button>
            <button
              onClick={() => { setTitle(''); setDescription(''); setSuccessPost(null); }}
              className="w-full py-4 bg-slate-100 text-slate-800 font-extrabold text-xs rounded-2xl hover:bg-slate-200 transition-all"
            >
              ✍️ Gửi Thêm Câu Chuyện Khác
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/90 flex flex-col gap-8">
          
          <div className="flex flex-col gap-2 pb-6 border-b border-slate-100">
            <div className="inline-flex items-center gap-2 text-brand-green font-black text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Chia Sẻ Điều Tử Tế Mỗi Ngày
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900">
              Gửi Câu Chuyện Việc Tốt Của Bạn
            </h1>
            <p className="text-xs text-slate-500">
              Điền thông tin và đính kèm tọa độ chính xác để truyền năng lượng tích cực đến mọi người.
            </p>
          </div>

          {/* AI Moderation Real-time Warning Warning Box */}
          {!modCheck.isClean && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs leading-relaxed">
                <span className="font-extrabold block text-rose-900">⚠️ Lưu ý Kiểm Duyệt Tự Động (AI Moderation Alert):</span>
                Hệ thống phát hiện từ khóa không phù hợp <strong>"{modCheck.kw}"</strong> trong nội dung của bạn. Nếu tiếp tục gửi, bài viết có thể bị tự động từ chối hoặc yêu cầu Admin xem xét kỹ.
              </div>
            </div>
          )}

               {/* Định Vị Tọa Độ Bằng Google Maps */}
              <div className="h-72 w-full rounded-3xl overflow-hidden border border-slate-200 shadow-md relative">
                <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black text-brand-green shadow-sm">
                  💡 Bấm trực tiếp chuột vào Bản đồ Google để gắn tọa độ
                </div>

                <MapComponent 
                  posts={[{
                    id: 'picker',
                    latitude: pickedLatLng[0],
                    longitude: pickedLatLng[1],
                    title: 'Vị trí Việc Tốt của bạn',
                    category: category,
                    imageUrl: imageUrl
                  }]}
                  selectedCenter={pickedLatLng}
                  className="h-full w-full"
                />
              </div>
