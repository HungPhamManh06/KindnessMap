import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapComponent } from '../components/MapComponent';
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Heart,
  MessageSquare,
  PlusCircle,
  Trophy,
  Star,
} from 'lucide-react';

const stats = [
  { value: '1,240+', label: 'Việc Tốt Đã Được Ghim' },
  { value: '580+', label: 'Công Dân Tích Cực' },
  { value: '15,400+', label: 'Điểm Việc Tốt Tích Lũy' },
  { value: '12+', label: 'Tỉnh / Thành Phố Phủ Sóng' },
];

const audiences = ['👨‍🎓 Sinh viên tích cực', '💚 Tình nguyện viên', '🏡 Cư dân địa phương', '🏢 Câu lạc bộ & CLB'];

const journeySteps = [
  {
    number: '1',
    title: 'Làm Việc Tốt',
    description: 'Nhặt rác, giúp đỡ người già, hiến máu hay tổ chức dạy học miễn phí.',
    badgeClass: 'bg-brand-green',
  },
  {
    number: '2',
    title: 'Ghim Lên Bản Đồ',
    description: 'Đăng bài viết cùng hình ảnh thực tế và chọn vị trí chính xác trên bản đồ.',
    badgeClass: 'bg-brand-teal',
  },
  {
    number: '3',
    title: 'Thăng Hạng & Huy Hiệu',
    description: 'Tích lũy từ 10 đến 50 điểm mỗi bài, nhận huy hiệu Hiệp Sĩ và giải thưởng tháng.',
    badgeClass: 'bg-gradient-to-r from-amber-500 to-rose-500',
  },
];

export const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setActiveModal } = useAuth();

  const [featuredStories, setFeaturedStories] = useState([]);
  const [mapPosts, setMapPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [storiesRes, mapRes] = await Promise.all([
        api.get('/posts/featured'),
        api.get('/posts/map'),
      ]);
      setFeaturedStories(storiesRes.data);
      setMapPosts(mapRes.data);
    } catch (error) {
      console.error('Failed to fetch home data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-16 pb-14 overflow-x-hidden">
      <section className="relative pt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="km-panel-hero px-6 sm:px-10 lg:px-14 py-12 sm:py-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_32%)] dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_28%)] pointer-events-none" />
          <div className="absolute -top-16 -right-10 w-60 h-60 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-lightGreen border border-brand-green/30 text-brand-deepGreen text-xs font-bold shadow-xs mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-brand-green animate-spin" style={{ animationDuration: '5s' }} />
              <span>Chiến dịch Nụ Cười & Việc Tốt Việt Nam 2026</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 max-w-5xl leading-[1.08]">
              Hãy Cùng Nhau Thắp Sáng <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-brand-green via-brand-teal to-emerald-600 bg-clip-text text-transparent">
                Bản Đồ Việc Tốt Cộng Đồng
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              KindnessMap là nơi lan tỏa những hành động tử tế bình dị xung quanh bạn. Hãy chia sẻ câu chuyện của mình, ghim dấu ấn lên bản đồ, tích lũy điểm công dân số và truyền cảm hứng cho hàng triệu người khác!
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (!isAuthenticated) setActiveModal('login');
                  else navigate('/submit');
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-green to-brand-teal text-white font-black text-base shadow-xl shadow-brand-green/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
              >
                <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                <span>Ghim Việc Tốt Của Bạn</span>
              </button>

              <button
                onClick={() => navigate('/explore')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-extrabold text-base border border-slate-200 dark:border-slate-700 shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Khám Phá Bản Đồ</span>
                <ArrowRight className="w-5 h-5 text-brand-green" />
              </button>
            </div>

            <div className="mt-14 pt-8 border-t border-slate-200/80 dark:border-slate-800 max-w-4xl w-full grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
              {audiences.map((item) => (
                <div key={item} className="km-panel-soft px-4 py-3 text-center">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="km-panel p-5 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                {stat.value}
              </div>
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mt-3">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 text-brand-green font-extrabold text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4" /> Bản Đồ Việc Tốt Trực Tuyến
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Khám Phá Lòng Tốt Quanh Bạn
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Theo dõi những điểm sáng tử tế, cụm hoạt động cộng đồng và các câu chuyện đang truyền cảm hứng khắp Việt Nam ngay trên bản đồ tương tác.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="km-panel-soft px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300">
              {mapPosts.length || 0} ghim việc tốt hiển thị trực tiếp
            </div>
            <button
              onClick={() => navigate('/explore')}
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors flex items-center gap-2 shrink-0"
            >
              <span>Mở Bản Đồ Toàn Màn Hình</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        <div className="km-panel p-3 sm:p-4">
          {loading ? (
            <div className="h-[550px] w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-3xl flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">
              🗺️ Đang tải dữ liệu Bản Đồ Việc Tốt...
            </div>
          ) : (
            <MapComponent posts={mapPosts} className="h-[560px] w-full rounded-[28px] overflow-hidden shadow-none border border-slate-200 dark:border-slate-800" />
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 text-rose-500 font-extrabold text-xs uppercase tracking-wider">
              <Star className="w-4 h-4 fill-rose-500" /> Câu Chuyện Lan Tỏa
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Những Câu Chuyện Truyền Cảm Hứng
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Các câu chuyện nổi bật đang nhận được nhiều yêu thích, bình luận và lan tỏa tích cực từ cộng đồng KindnessMap.
            </p>
          </div>
          <button
            onClick={() => navigate('/stories')}
            className="font-extrabold text-sm text-brand-green hover:underline flex items-center gap-1"
          >
            <span>Xem tất cả câu chuyện</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredStories.length === 0 ? (
            <div className="col-span-3 km-panel p-12 text-center text-slate-400 dark:text-slate-500 font-medium">
              Hiện chưa có câu chuyện nổi bật nào.
            </div>
          ) : (
            featuredStories.map((story) => (
              <article
                key={story.id}
                className="km-panel overflow-hidden group hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative h-56 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/70 to-transparent pointer-events-none" />
                  <span className="absolute top-4 left-4 px-3 py-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full text-xs font-black text-brand-deepGreen shadow-md">
                    {story.category}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium">
                      <span>📍 {story.locationName}</span>
                      <span>📅 {new Date(story.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 group-hover:text-brand-green transition-colors leading-snug line-clamp-2">
                      {story.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {story.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={story.authorAvatar} alt={story.authorName} className="w-8 h-8 rounded-full object-cover bg-slate-200 dark:bg-slate-700 ring-1 ring-black/5 dark:ring-white/5" />
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{story.authorName}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 hover:text-rose-500 transition-colors">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                        <span>{story.likesCount}</span>
                      </span>
                      <span className="flex items-center gap-1 hover:text-brand-blue transition-colors">
                        <MessageSquare className="w-4 h-4 text-brand-blue" />
                        <span>{story.commentsCount}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-slate-900 text-white py-16 px-6 sm:px-10 lg:px-14 rounded-[32px] relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-green/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),_transparent_30%)] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto gap-4">
            <span className="text-emerald-400 font-extrabold text-xs uppercase tracking-widest">
              🏆 Hệ Thống Điểm Công Dân Số
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Gieo Mầm Lòng Tốt – Nhận Quả Ngọt
            </h2>
            <p className="text-slate-300 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-3xl">
              Mỗi hành động tử tế của bạn, dù nhỏ bé nhất, đều có giá trị to lớn. KindnessMap ghi nhận và trao tặng bạn những danh hiệu cao quý cùng phần thưởng hàng tháng từ cộng đồng.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 w-full text-left">
              {journeySteps.map((step) => (
                <div key={step.number} className="rounded-2xl bg-white/10 dark:bg-slate-800/60 border border-white/10 backdrop-blur-md p-6 flex flex-col gap-2">
                  <span className={`w-8 h-8 rounded-xl ${step.badgeClass} text-white font-black flex items-center justify-center text-sm`}>
                    {step.number}
                  </span>
                  <h4 className="font-bold text-sm text-white mt-1">{step.title}</h4>
                  <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/leaderboard')}
              className="mt-8 px-8 py-3.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Xem Danh Sách Top Dẫn Đầu</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
