import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Heart,
  MessageSquare,
  Share2,
  Star,
  Send,
  ExternalLink,
  MapPin,
  Check,
  Copy,
  Flame,
  User,
  Sparkles,
  X,
  Filter,
} from 'lucide-react';

const FALLBACK_STORY_IMAGE = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%201200%20700%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20x2%3D%271%27%20y1%3D%270%27%20y2%3D%271%27%3E%3Cstop%20stop-color%3D%27%2310b981%27%2F%3E%3Cstop%20offset%3D%270.55%27%20stop-color%3D%27%230f766e%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%230f172a%27%2F%3E%3C%2FlinearGradient%3E%3CradialGradient%20id%3D%27r%27%20cx%3D%2750%25%27%20cy%3D%2735%25%27%20r%3D%2760%25%27%3E%3Cstop%20stop-color%3D%27%23ffffff%27%20stop-opacity%3D%270.22%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%23ffffff%27%20stop-opacity%3D%270%27%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%271200%27%20height%3D%27700%27%20fill%3D%27url(%23g)%27%2F%3E%3Crect%20width%3D%271200%27%20height%3D%27700%27%20fill%3D%27url(%23r)%27%2F%3E%3Cg%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-width%3D%2718%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20opacity%3D%270.92%27%20transform%3D%27translate(510%20225)%20scale(3.3)%27%3E%3Cpath%20d%3D%27M20.8%204.6a5.5%205.5%200%200%200-7.8%200L12%205.7l-1-1.1a5.5%205.5%200%200%200-7.8%207.8l1%201L12%2021l7.8-7.6%201-1a5.5%205.5%200%200%200%200-7.8z%27%2F%3E%3Cpath%20d%3D%27M12%205.7l-2.6%202.6a2%202%200%200%200%200%202.8l.2.2a2%202%200%200%200%202.8%200L14%209.8%27%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%27600%27%20y%3D%27525%27%20text-anchor%3D%27middle%27%20font-family%3D%27Inter%2CArial%2Csans-serif%27%20font-size%3D%2756%27%20font-weight%3D%27800%27%20fill%3D%27%23ffffff%27%3EKindnessMap%3C%2Ftext%3E%3Ctext%20x%3D%27600%27%20y%3D%27590%27%20text-anchor%3D%27middle%27%20font-family%3D%27Inter%2CArial%2Csans-serif%27%20font-size%3D%2728%27%20font-weight%3D%27600%27%20fill%3D%27%23d1fae5%27%3EB%E1%BA%A3n%20%C4%90%E1%BB%93%20Vi%E1%BB%87c%20T%E1%BB%91t%3C%2Ftext%3E%3C%2Fsvg%3E';

const applyFallbackImage = (event) => {
  if (event.currentTarget.dataset.fallbackApplied === 'true') return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = FALLBACK_STORY_IMAGE;
};

export const KindnessStories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetId = searchParams.get('id');
  const navigate = useNavigate();

  const { isAuthenticated, user, setActiveModal } = useAuth();
  const { addToast } = useNotification();

  const [stories, setStories] = useState([]);
  const [trendingStories, setTrendingStories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Story Detail view for Comments and full read
  const [activeStory, setActiveStory] = useState(null);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const commentsCacheRef = useRef(new Map());
  const modalBodyRef = useRef(null);

  // Share Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [storyToShare, setStoryToShare] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filters
  const [selectedCat, setSelectedCat] = useState('All');

  const categories = ['All', 'Môi trường', 'Người cao tuổi', 'Trồng cây', 'Hiến máu', 'Giáo dục', 'Tình nguyện', 'Cộng đồng'];

  useEffect(() => {
    fetchStories();
  }, [selectedCat, targetId]);

  useEffect(() => {
    if (activeStory && modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
  }, [activeStory?.id]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts', { params: { category: selectedCat === 'All' ? '' : selectedCat } });
      setStories(res.data);
      
      // Select Top 4 most liked for Trending Stories
      const trending = [...res.data].sort((a, b) => b.likesCount - a.likesCount).slice(0, 4);
      setTrendingStories(trending);

      // If targetId is present, open that story's modal. If current category filter hides it, fetch directly by id.
      if (targetId) {
        const numericTargetId = parseInt(targetId);
        const matching = res.data.find((s) => s.id === numericTargetId);
        if (matching) {
          openStoryDetail(matching);
        } else {
          const detailRes = await api.get(`/posts/${numericTargetId}`);
          if (detailRes.data?.post) openStoryDetail(detailRes.data.post);
        }
      }
    } catch (error) {
      console.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const openStoryDetail = async (story) => {
    setActiveStory(story);

    const cachedComments = commentsCacheRef.current.get(story.id);
    if (cachedComments) {
      setComments(cachedComments);
    }

    try {
      setDetailLoading(!cachedComments);
      const res = await api.get(`/posts/${story.id}`);
      const nextComments = res.data.comments || [];
      commentsCacheRef.current.set(story.id, nextComments);
      setComments(nextComments);
      if (res.data.post) {
        setActiveStory((prev) => ({ ...(prev || story), ...res.data.post }));
      }
    } catch (e) {
      console.error('Failed to get story comments');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeStoryDetail = () => {
    setActiveStory(null);
    setSearchParams({}); // remove id query param
  };

  const handleToggleLike = async (story, e) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) {
      setActiveModal('login');
      return;
    }

    try {
      const res = await api.post(`/posts/${story.id}/like`);
      const isLiked = res.data.isLiked;

      // Update in memory
      setStories((prev) =>
        prev.map((s) =>
          s.id === story.id
            ? { ...s, likesCount: isLiked ? s.likesCount + 1 : s.likesCount - 1 }
            : s
        )
      );

      if (activeStory && activeStory.id === story.id) {
        setActiveStory((prev) => ({
          ...prev,
          likesCount: isLiked ? prev.likesCount + 1 : prev.likesCount - 1,
        }));
      }

      addToast(isLiked ? 'Đã thích câu chuyện! 💖' : 'Đã bỏ thích.', '', 'success');
    } catch (error) {
      addToast('Không thể thực hiện', 'Vui lòng thử lại sau.', 'warning');
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setActiveModal('login');
      return;
    }
    if (!newCommentText.trim()) return;

    try {
      setSendingComment(true);
      const res = await api.post(`/posts/${activeStory.id}/comment`, { content: newCommentText });
      
      setComments((prev) => {
        const nextComments = [res.data.comment, ...prev];
        commentsCacheRef.current.set(activeStory.id, nextComments);
        return nextComments;
      });
      setStories((prev) =>
        prev.map((s) => (s.id === activeStory.id ? { ...s, commentsCount: s.commentsCount + 1 } : s))
      );
      setActiveStory((prev) => ({ ...prev, commentsCount: prev.commentsCount + 1 }));
      setNewCommentText('');
      addToast('Đã gửi bình luận!', 'Cảm ơn chia sẻ của bạn.', 'success');
    } catch (error) {
      addToast('Lỗi gửi bình luận', error.response?.data?.message || 'Vui lòng thử lại.', 'warning');
    } finally {
      setSendingComment(false);
    }
  };

  const triggerShare = (story, e) => {
    if (e) e.stopPropagation();
    setStoryToShare(story);
    setShareModalOpen(true);
    setCopiedLink(false);
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/stories?id=${storyToShare?.id}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    addToast('Đã sao chép liên kết!', 'Bạn có thể gửi ngay cho bạn bè.', 'success');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      
      {/* Page Title & Intro */}
      <div className="bg-gradient-to-r from-brand-deepGreen via-brand-green to-brand-teal p-8 sm:p-12 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 bg-white/10 dark:bg-slate-800/50 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col gap-3 relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-slate-800/60 backdrop-blur-md text-xs font-black w-fit tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" /> Lan Tỏa Cảm Hứng
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Những Câu Chuyện Việc Tốt Truyền Cảm Hứng
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-normal">
            Mỗi bài viết là một tấm gương sáng, một hành động thiết thực giúp xây dựng cộng đồng nhân ái. Hãy bấm Thích, gửi Bình luận để cổ vũ các tác giả tuyệt vời của chúng ta!
          </p>
        </div>

        <button
          onClick={() => {
            if (!isAuthenticated) setActiveModal('login');
            else navigate('/submit');
          }}
          className="px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 text-brand-deepGreen font-black text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all shrink-0 self-center md:self-end"
        >
          ✍️ Viết Câu Chuyện Của Bạn
        </button>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black shrink-0 transition-all ${
                  selectedCat === cat
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-105'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat === 'All' ? '🌟 Tất Cả Danh Mục' : cat}
              </button>
            ))}
          </div>

          {/* Stories List */}
          <div className="flex flex-col gap-8">
            {loading ? (
              <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-extrabold text-sm animate-pulse">
                Đang tải feed câu chuyện...
              </div>
            ) : stories.length === 0 ? (
              <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-bold text-sm">
                Chưa có câu chuyện nào trong danh mục này.
              </div>
            ) : (
              stories.map((story) => (
                <article
                  key={story.id}
                  id={`story-${story.id}`}
                  onClick={() => {
                    setSearchParams({ id: story.id });
                    openStoryDetail(story);
                  }}
                  className="bg-white dark:bg-slate-900 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700/90 dark:border-slate-700/80 overflow-hidden flex flex-col group cursor-pointer"
                >
                  {/* Image full width */}
                  <div className="relative h-72 sm:h-96 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={story.imageUrl || FALLBACK_STORY_IMAGE}
                      alt={story.title}
                      loading="lazy"
                      decoding="async"
                      onError={applyFallbackImage}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="px-3.5 py-1.5 bg-brand-green/95 text-white font-extrabold text-xs rounded-full shadow-md backdrop-blur-xs">
                        {story.category}
                      </span>
                      {story.isFeatured === 1 && (
                        <span className="px-3 py-1.5 bg-amber-500/95 text-white font-extrabold text-xs rounded-full shadow-md flex items-center gap-1 backdrop-blur-xs">
                          <Star className="w-3.5 h-3.5 fill-white" /> Nổi Bật
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="p-6 sm:p-8 flex flex-col gap-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 dark:text-slate-400">
                        <MapPin className="w-4 h-4 text-brand-green" /> {story.locationName}
                      </span>
                      <span>📅 {new Date(story.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 group-hover:text-brand-green transition-colors leading-snug">
                      {story.title}
                    </h2>

                    <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
                      {story.description}
                    </p>

                    {/* Footer interactions */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        <img src={story.authorAvatar || FALLBACK_STORY_IMAGE} alt={story.authorName} onError={applyFallbackImage} className="w-10 h-10 rounded-full object-cover bg-slate-200 dark:bg-slate-700 border" />
                        <div className="flex flex-col">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{story.authorName}</span>
                          <span className="text-[10px] font-bold text-brand-green uppercase">Tác giả gieo duyên</span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleLike(story, e)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-rose-50 text-slate-700 dark:text-slate-200 hover:text-rose-600 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 active:scale-95"
                        >
                          <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20 active:scale-125 transition-transform" />
                          <span>{story.likesCount}</span>
                        </button>

                        <button
                          onClick={() => {
                            setSearchParams({ id: story.id });
                            openStoryDetail(story);
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-brand-lightBlue text-slate-700 dark:text-slate-200 hover:text-brand-blue font-bold text-xs transition-all border border-slate-200 dark:border-slate-700"
                        >
                          <MessageSquare className="w-4 h-4 text-brand-blue" />
                          <span>{story.commentsCount} Bình luận</span>
                        </button>

                        <button
                          onClick={(e) => triggerShare(story, e)}
                          className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-400 transition-colors border border-slate-200 dark:border-slate-700"
                          title="Chia sẻ câu chuyện"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Column (Trending Stories) */}
        <aside className="lg:col-span-4 flex flex-col gap-6 sticky top-28">
          <div className="km-panel p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-rose-500 font-black text-sm uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800">
              <Flame className="w-5 h-5 fill-rose-500" />
              <span>Xu Hướng Cộng Đồng</span>
            </div>

            <div className="flex flex-col gap-4 divide-y divide-slate-100">
              {trendingStories.map((ts, idx) => (
                <div
                  key={ts.id}
                  onClick={() => {
                    setSearchParams({ id: ts.id });
                    openStoryDetail(ts);
                  }}
                  className="pt-4 first:pt-0 flex items-start gap-3.5 cursor-pointer group"
                >
                  <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black flex items-center justify-center shrink-0 text-xs group-hover:bg-brand-green group-hover:text-white transition-colors">
                    #{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="text-[10px] font-black text-brand-green uppercase tracking-wider">{ts.category}</span>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-brand-green transition-colors leading-snug line-clamp-2 mt-0.5">
                      {ts.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      ❤️ {ts.likesCount} lượt thích • 💬 {ts.commentsCount} bình luận
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inspirational Digital Quote Box */}
          <div className="bg-gradient-to-tr from-brand-deepGreen to-brand-teal p-6 rounded-3xl text-white shadow-xl flex flex-col gap-3">
            <QuoteIcon className="w-8 h-8 text-emerald-200 opacity-60" />
            <p className="text-xs font-semibold leading-relaxed italic">
              "Lòng tốt là thứ ngôn ngữ mà người điếc có thể nghe và người mù có thể thấy."
            </p>
            <span className="text-[10px] font-black uppercase text-emerald-200 tracking-wider text-right">
              – Mark Twain
            </span>
          </div>
        </aside>

      </div>

      {/* Detailed Story Modal with Real-time Comments */}
      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/72 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div key={activeStory.id} className="relative w-full max-w-3xl km-modal-shell overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-brand-green/10 via-brand-blue/10 to-emerald-500/10 dark:from-brand-green/15 dark:via-cyan-500/10 dark:to-emerald-500/10 pointer-events-none" />
            
            {/* Modal Header Bar */}
            <div className="p-4 bg-slate-900/95 dark:bg-slate-950 text-white flex items-center justify-between shrink-0 border-b border-white/5">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <Star className="w-4 h-4 fill-emerald-400" /> Chi tiết câu chuyện việc tốt
              </span>
              <button
                onClick={closeStoryDetail}
                className="p-1.5 rounded-xl bg-white/10 dark:bg-slate-800/50 hover:bg-white/20 dark:bg-slate-800/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll Body */}
            <div ref={modalBodyRef} className="overflow-y-auto flex-1 p-6 sm:p-8 flex flex-col gap-6 relative z-10">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="px-3 py-1 bg-brand-lightGreen text-brand-deepGreen font-black text-xs rounded-full border border-brand-green/20">
                    {activeStory.category}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                    📍 {activeStory.locationName} • {new Date(activeStory.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 leading-snug">
                  {activeStory.title}
                </h1>
              </div>

              <div className="rounded-[28px] overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-xl bg-slate-100 dark:bg-slate-800/60 min-h-[280px] sm:min-h-[360px] relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_40%)] pointer-events-none" />
                <img
                  key={activeStory.id}
                  src={activeStory.imageUrl || FALLBACK_STORY_IMAGE}
                  alt={activeStory.title}
                  loading="eager"
                  decoding="async"
                  onError={applyFallbackImage}
                  className="block w-full h-[280px] sm:h-[360px] object-cover"
                />
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-slate-700 dark:text-slate-200 text-base leading-relaxed whitespace-pre-line bg-slate-50/90 dark:bg-slate-800/70 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700/60 shadow-sm">
                  {activeStory.description}
                </p>
              </div>

              {/* Author and Quick Tools */}
              <div className="py-4 px-5 rounded-[24px] border border-slate-200 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <img src={activeStory.authorAvatar || FALLBACK_STORY_IMAGE} alt={activeStory.authorName} onError={applyFallbackImage} className="w-12 h-12 rounded-full object-cover border-2 border-brand-green shadow-md" />
                  <div className="flex flex-col">
                    <span className="font-black text-sm text-slate-900 dark:text-slate-100">{activeStory.authorName}</span>
                    <span className="text-xs text-brand-green font-bold">Thành viên năng nổ • Người kể chuyện tử tế</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => handleToggleLike(activeStory)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 font-extrabold text-xs border border-rose-200 dark:border-rose-500/15 shadow-sm"
                  >
                    <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                    <span>{activeStory.likesCount} Thích</span>
                  </button>

                  <button
                    onClick={() => triggerShare(activeStory)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> Chia sẻ
                  </button>
                </div>
              </div>

              {/* Comment Section */}
              <div className="flex flex-col gap-6 pt-2">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-blue" />
                  <span>Bình Luận Cộng Đồng ({comments.length})</span>
                </h3>

                {/* Add comment Form */}
                {isAuthenticated ? (
                  <form onSubmit={handleSendComment} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Viết bình luận động viên hoặc đặt câu hỏi..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="flex-1 px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                    />
                    <button
                      type="submit"
                      disabled={sendingComment || !newCommentText.trim()}
                      className="px-6 py-3.5 rounded-2xl bg-brand-blue hover:bg-brand-deepBlue text-white font-extrabold text-xs shadow-md shadow-brand-blue/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all shrink-0"
                    >
                      <span>Gửi Bình Luận</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-center text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400 font-medium">
                    Vui lòng{' '}
                    <button onClick={() => setActiveModal('login')} className="font-extrabold text-brand-green hover:underline">
                      Đăng nhập
                    </button>{' '}
                    để tham gia thảo luận cùng mọi người.
                  </div>
                )}

                {/* Comment items */}
                <div className="flex flex-col gap-4 divide-y divide-slate-100 dark:divide-slate-800">
                  {detailLoading ? (
                    <div className="space-y-3 py-2">
                      <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                      <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                      Hãy là người đầu tiên gửi bình luận về việc tốt này!
                    </p>
                  ) : (
                    comments.map((cmt) => (
                      <div key={cmt.id} className="pt-4 first:pt-0 flex items-start gap-3.5 animate-fade-in">
                        <img src={cmt.authorAvatar || FALLBACK_STORY_IMAGE} alt={cmt.authorName} onError={applyFallbackImage} className="w-9 h-9 rounded-full object-cover bg-slate-200 dark:bg-slate-700 shrink-0 mt-0.5" />
                        <div className="flex-1 bg-slate-50/90 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{cmt.authorName}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              {new Date(cmt.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-200 mt-1.5 leading-relaxed">{cmt.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Social Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="km-modal-shell max-w-sm w-full p-6 flex flex-col gap-4 relative">
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-brand-green" /> Lan Tỏa Câu Chuyện
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400">
              Chia sẻ câu chuyện <strong>"{storyToShare?.title}"</strong> để gieo hạt giống tử tế đến cộng đồng.
            </p>

            <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/stories?id=${storyToShare?.id}`}
                className="w-full bg-transparent text-xs px-2 text-slate-500 dark:text-slate-400 font-mono focus:outline-none select-all"
              />
              <button
                onClick={copyShareLink}
                className="px-4 py-2 bg-brand-green text-white rounded-xl font-bold text-xs shrink-0 flex items-center gap-1 shadow-sm"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/stories?id=${storyToShare?.id}`)}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 rounded-xl bg-[#1877F2] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                📘 Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/stories?id=${storyToShare?.id}`)}&text=${encodeURIComponent(`Hãy xem câu chuyện việc tốt này trên KindnessMap VN: ${storyToShare?.title}`)}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 rounded-xl bg-[#1DA1F2] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                🐦 Twitter
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// SVG helper for quote icon
const QuoteIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M14 17h3l2-4V7h-6v6h3M6 17h3l2-4V7H5v6h3" />
  </svg>
);
