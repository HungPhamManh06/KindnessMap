import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MapComponent } from '../components/MapComponent';
import { Search, Filter, MapPin, ExternalLink, Sparkles, SlidersHorizontal, ArrowRight } from 'lucide-react';

export const ExploreMap = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
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
    filterData();
  }, [selectedCategory, searchQuery, posts]);

  const filterData = () => {
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
  };

  const handleCardClick = (post) => {
    const lat = parseFloat(post.latitude);
    const lng = parseFloat(post.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      setSelectedCenter([lat, lng]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      
      {/* Title Header & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-lg border border-slate-200">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-brand-green" /> Khám Phá Bản Đồ Việc Tốt
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ghim trực tiếp các hoạt động từ thiện và môi trường trên toàn quốc
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo khu vực, tiêu đề hoặc nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* Category Filter Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Lọc Theo Mục:
        </div>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all ${
              selectedCategory === cat
                ? 'bg-brand-green text-white shadow-md shadow-brand-green/25 scale-105'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
            }`}
          >
            {cat === 'All' ? '🌟 Tất Cả Mục' : cat}
          </button>
        ))}
      </div>

      {/* Main Interactive Map & Directory Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Interactive List */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <span className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
              Danh sách hiển thị ({filteredPosts.length})
            </span>
            <span className="text-xs font-medium text-slate-500">
              💡 Bấm vào thẻ để định vị bản đồ
            </span>
          </div>

          <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2">
            {loading ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 font-bold text-xs">
                Đang tải danh sách...
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 font-bold text-xs flex flex-col items-center gap-2">
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
                <div
                  key={post.id}
                  onClick={() => handleCardClick(post)}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col gap-3 group hover:border-brand-green"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-brand-green border border-brand-green/20 rounded-full text-[10px] font-black uppercase">
                          {post.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-xs text-slate-900 mt-1.5 leading-snug group-hover:text-brand-green transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {post.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500 text-[11px]">
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
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Big Map Container */}
        <div className="lg:col-span-7 sticky top-28">
          <MapComponent
            posts={filteredPosts}
            selectedCenter={selectedCenter}
            className="h-[630px] w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
          />
        </div>

      </div>
    </div>
  );
};
