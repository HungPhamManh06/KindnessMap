import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapComponent } from '../components/MapComponent';
import { BadgeIcon } from '../components/BadgeIcon';
import { 
  HeartHandshake, ArrowRight, Sparkles, MapPin, Heart, 
  MessageSquare, Share2, PlusCircle, Trophy, Users, Star, Flame, CheckCircle2 
} from 'lucide-react';

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
    <div className="flex flex-col gap-24 pb-12 overflow-x-hidden">
      
      {/* 1. Hero Banner */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        
        {/* Background ambient glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-brand-green/20 to-brand-blue/20 blur-3xl rounded-full pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '8s' }} />

        {/* Small top chip */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-lightGreen border border-brand-green/30 text-brand-deepGreen text-xs font-bold shadow-xs mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-brand-green animate-spin" style={{ animationDuration: '5s' }} />
          <span>Chiến dịch Nụ Cười & Việc Tốt Việt Nam 2026</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-5xl leading-[1.15]">
          Hãy Cùng Nhau Thắp Sáng <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-brand-green via-brand-teal to-emerald-600 bg-clip-text text-transparent">
            Bản Đồ Việc Tốt Cộng Đồng
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-3xl leading-relaxed font-normal">
          KindnessMap là nơi lan tỏa những hành động tử tế bình dị xung quanh bạn. Hãy chia sẻ câu chuyện của mình, ghim dấu ấn lên bản đồ, tích lũy điểm công dân số và truyền cảm hứng cho hàng triệu người khác!
        </p>

        {/* Call to action buttons */}
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
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-base border border-slate-200 shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Khám Phá Bản Đồ</span>
            <ArrowRight className="w-5 h-5 text-brand-green" />
          </button>
        </div>

        {/* Target Audiences Floating Bar */}
        <div className="mt-16 pt-8 border-t border-slate-200/80 max-w-4xl w-full flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs sm:text-sm font-bold text-slate-500">
          <span className="flex items-center gap-2">👨‍🎓 Sinh viên tích cực</span>
          <span className="flex items-center gap-2">💚 Tình nguyện viên</span>
          <span className="flex items-center gap-2">🏡 Cư dân địa phương</span>
          <span className="flex items-center gap-2">🏢 Câu lạc bộ & CLB</span>
        </div>

      </section>

      {/* 2. Platform Statistics Counters */}
      <section className="bg-gradient-to-r from-brand-green to-brand-teal text-white py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-x-0 lg:divide-x divide-emerald-400/50">
          <div className="flex flex-col items-center p-4">
            <span className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-md">1,240+</span>
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider mt-2 opacity-90">Việc Tốt Đã Được Ghim</span>
          </div>
          <div className="flex flex-col items-center p-4">
            <span className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-md">580+</span>
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider mt-2 opacity-90">Công Dân Tích Cực</span>
          </div>
          <div className="flex flex-col items-center p-4">
            <span className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-md">15,400+</span>
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider mt-2 opacity-90">Điểm Việc Tốt Tích Lũy</span>
          </div>
          <div className="flex flex-col items-center p-4">
            <span className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-md">12+</span>
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider mt-2 opacity-90">Tỉnh / Thành Phố Phủ Sóng</span>
          </div>
        </div>
      </section>

      {/* 3. Interactive Map Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 text-brand-green font-extrabold text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4" /> Bản Đồ Việc Tốt Trực Tuyến
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Khám Phá Lòng Tốt Quanh Bạn
            </h2>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors flex items-center gap-2 shrink-0"
          >
            <span>Mở Bản Đồ Toàn Màn Hình</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>

        {/* Map Component Container */}
        {loading ? (
          <div className="h-[550px] w-full bg-slate-200 animate-pulse rounded-3xl flex items-center justify-center text-slate-500 font-bold">
            🗺️ Đang tải dữ liệu Bản Đồ Việc Tốt...
          </div>
        ) : (
          <MapComponent posts={mapPosts} />
        )}
      </section>

      {/* 4. Featured Kindness Stories Carousel/Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 text-rose-500 font-extrabold text-xs uppercase tracking-wider">
              <Star className="w-4 h-4 fill-rose-500" /> Câu Chuyện Lan Tỏa
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Những Câu Chuyện Truyền Cảm Hứng
            </h2>
          </div>
          <button
            onClick={() => navigate('/stories')}
            className="font-extrabold text-sm text-brand-green hover:underline flex items-center gap-1"
          >
            <span>Xem tất cả câu chuyện</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredStories.length === 0 ? (
            <div className="col-span-3 p-12 text-center text-slate-400 font-medium">
              Hiện chưa có câu chuyện nổi bật nào.
            </div>
          ) : (
            featuredStories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 flex flex-col overflow-hidden group hover:-translate-y-1"
              >
                {/* Story Image */}
                <div className="relative h-56 overflow-hidden bg-slate-100">
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-xs font-black text-brand-deepGreen shadow-md">
                    {story.category}
                  </span>
                </div>

                {/* Content info */}
                <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>📍 {story.locationName}</span>
                      <span>📅 {new Date(story.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-brand-green transition-colors leading-snug line-clamp-2">
                      {story.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {story.description}
                    </p>
                  </div>

                  {/* Author footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={story.authorAvatar} alt={story.authorName} className="w-8 h-8 rounded-full object-cover bg-slate-200" />
                      <span className="font-bold text-xs text-slate-800">{story.authorName}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
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
              </div>
            ))
          )}
        </div>
      </section>

      {/* 5. How It Works Guide Banner */}
      <section className="bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto rounded-3xl w-full relative overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-green/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto gap-4">
          <span className="text-emerald-400 font-extrabold text-xs uppercase tracking-widest">
            🏆 Hệ Thống Điểm Công Dân Số
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Gieo Mầm Lòng Tốt – Nhận Quả Ngọt
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Mỗi hành động tử tế của bạn, dù nhỏ bé nhất, đều có giá trị to lớn. KindnessMap ghi nhận và trao tặng bạn những danh hiệu cao quý cùng phần thưởng hàng tháng từ cộng đồng.
          </p>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10 w-full text-left">
            <div className="p-6 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md flex flex-col gap-2">
              <span className="w-8 h-8 rounded-xl bg-brand-green text-white font-black flex items-center justify-center text-sm">1</span>
              <h4 className="font-bold text-sm text-white mt-1">Làm Việc Tốt</h4>
              <p className="text-xs text-slate-300 leading-relaxed">Nhặt rác, giúp đỡ người già, hiến máu hay tổ chức dạy học miễn phí.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md flex flex-col gap-2">
              <span className="w-8 h-8 rounded-xl bg-brand-teal text-white font-black flex items-center justify-center text-sm">2</span>
              <h4 className="font-bold text-sm text-white mt-1">Ghim Lên Bản Đồ</h4>
              <p className="text-xs text-slate-300 leading-relaxed">Đăng bài viết cùng hình ảnh thực tế và chọn vị trí chính xác trên bản đồ.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md flex flex-col gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black flex items-center justify-center text-sm">3</span>
              <h4 className="font-bold text-sm text-white mt-1">Thăng Hạng & Huy Hiệu</h4>
              <p className="text-xs text-slate-300 leading-relaxed">Tích lũy từ 10 đến 50 điểm mỗi bài, nhận huy hiệu Hiệp Sĩ và giải thưởng tháng.</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/leaderboard')}
            className="mt-8 px-8 py-3.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Xem Danh Sách Top Dẫn Đầu</span>
          </button>
        </div>
      </section>

    </div>
  );
};
