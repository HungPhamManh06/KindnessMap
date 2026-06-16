import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MapComponent } from '../components/MapComponent';
import { Search, MapPin, SlidersHorizontal, ArrowRight, Sparkles } from 'lucide-react';

export const ExploreMap = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState(null);

  const categories = ['All', 'Môi trường', 'Người cao tuổi', 'Trồng cây', 'Hiến máu', 'Giáo dục', 'Tình nguyện', 'Cộng đồng'];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts');
      setPosts(res.data);
      setFilteredPosts(res.data);
    } catch (error) {
      console.error('Failed to load map explore posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...posts];

    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.locationName?.toLowerCase().includes(q)
      );
    }

    setFilteredPosts(result);
  }, [selectedCategory, searchQuery, posts]);

  const handleCardClick = (post) => {
    const lat = parseFloat(post.latitude);
    const lng = parseFloat(post.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      setSelectedCenter([lat, lng]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <section className="km-panel-hero p-6 sm:p-8 lg:p-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_28%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.16),_transparent_24%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="flex flex-col gap-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-lightGreen border border-brand-green/20 text-brand-deepGreen text-xs font-black w-fit uppercase tracking-wide">
                <Sparkles className="w-4 h-4" /> Khám phá cộng đồng tử tế
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-slate-50 leading-tight">
                Khám Phá Bản Đồ Việc Tốt Trên Toàn Quốc
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Tìm nhanh theo khu vực, danh mục hoặc nội dung để xem các câu chuyện tử tế đang diễn ra quanh bạn và định vị tức thì trên bản đồ tương tác.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="km-panel-soft px-4 py-4 text-center min-w-[130px]">
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{filteredPosts.length}</div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mt-2">Kết quả</div>
              </div>
              <div className="km-panel-soft px-4 py-4 text-center min-w-[130px]">
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{categories.length - 1}</div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mt-2">Danh mục</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Tìm theo khu vực, tiêu đề hoặc nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl km-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            <div className="lg:col-span-5 flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Lọc theo mục:
              </div>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all ${
                    selectedCategory === cat
                      ? 'bg-brand-green text-white shadow-md shadow-brand-green/25 scale-105'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs'
                  }`}
                >
                  {cat === 'All' ? '🌟 Tất Cả Mục' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 km-panel p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="font-extrabold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Danh sách hiển thị ({filteredPosts.length})
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              💡 Bấm vào thẻ để định vị bản đồ
            </span>
          </div>

          <div className="flex flex-col gap-4 max-h-[650px] overflow-y-auto pr-2">
            {loading ? (
              <div className="p-12 text-center km-panel-soft text-slate-400 dark:text-slate-500 font-bold text-xs">
                Đang tải danh sách...
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="p-12 text-center km-panel-soft text-slate-400 dark:text-slate-500 font-bold text-xs flex flex-col items-center gap-2">
                <span>🚫 Không tìm thấy việc tốt phù hợp.</span>
                <button
                  onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                  className="text-brand-green font-bold text-xs hover:underline mt-1"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => handleCardClick(post)}
                  className="p-4 rounded-[26px] bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col gap-3 group hover:border-brand-green"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-xs ring-1 ring-black/5 dark:ring-white/5 group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-brand-green border border-brand-green/20 rounded-full text-[10px] font-black uppercase">
                          {post.category}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                          {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 mt-1.5 leading-snug group-hover:text-brand-green transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {post.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                      👤 {post.authorName}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/stories?id=${post.id}`); }}
                      className="text-brand-green hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Xem câu chuyện</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-7 sticky top-28">
          <div className="km-panel p-3 sm:p-4">
            <MapComponent
              posts={filteredPosts}
              selectedCenter={selectedCenter}
              className="h-[650px] w-full rounded-[28px] overflow-hidden shadow-none border border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
