import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  MapPin,
  Heart,
  MessageSquare,
  PlusCircle,
  Trophy,
  Star,
  HeartHandshake,
} from 'lucide-react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { CinematicVideoBackground } from '../components/CinematicVideoBackground';
import { useGsapHomeAnimations } from '../hooks/useGsapHomeAnimations';

const LazyMapComponent = lazy(() =>
  import('../components/MapComponent').then((m) => ({ default: m.MapComponent }))
);

/* ─── Constants ────────────────────────────────────────────────────────── */
const statDefinitions = [
  { key: 'pinnedGoodDeeds', label: 'Việc Tốt Đã Ghim' },
  { key: 'activeCitizens',  label: 'Công Dân Tích Cực' },
  { key: 'kindnessPoints',  label: 'Điểm Tích Lũy' },
  { key: 'coveredCities',   label: 'Tỉnh / Thành Phố' },
];

const emptySiteStats = {
  pinnedGoodDeeds: 0,
  activeCitizens: 0,
  kindnessPoints: 0,
  coveredCities: 0,
};

const FALLBACK_IMAGE =
  'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%201200%20700%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20x2%3D%271%27%20y1%3D%270%27%20y2%3D%271%27%3E%3Cstop%20stop-color%3D%27%2310b981%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%230f172a%27%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%271200%27%20height%3D%27700%27%20fill%3D%27url(%23g)%27%2F%3E%3C%2Fsvg%3E';

const applyFallback = (e) => {
  if (e.currentTarget.dataset.fb === 'true') return;
  e.currentTarget.dataset.fb = 'true';
  e.currentTarget.src = FALLBACK_IMAGE;
};

const journeySteps = [
  {
    n: '1',
    title: 'Làm Việc Tốt',
    desc: 'Nhặt rác, giúp người già, hiến máu hay tổ chức dạy học miễn phí.',
    cls: 'bg-emerald-600',
  },
  {
    n: '2',
    title: 'Ghim Lên Bản Đồ',
    desc: 'Đăng bài cùng hình ảnh thực tế và chọn vị trí chính xác trên bản đồ.',
    cls: 'bg-teal-600',
  },
  {
    n: '3',
    title: 'Thăng Hạng & Huy Hiệu',
    desc: 'Tích lũy từ 10–50 điểm mỗi bài, nhận huy hiệu Hiệp Sĩ và giải thưởng tháng.',
    cls: 'bg-gradient-to-r from-amber-500 to-rose-500',
  },
];

const MapSkeleton = () => (
  <div className="h-[520px] w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-[28px] flex items-center justify-center text-slate-500 dark:text-slate-400 font-semibold">
    🗺️ Đang chuẩn bị bản đồ tương tác...
  </div>
);

const useIsSmall = () => {
  const [sm, setSm] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(max-width: 767px)');
    setSm(m.matches);
    const h = () => setSm(m.matches);
    m.addEventListener ? m.addEventListener('change', h) : m.addListener(h);
    return () => (m.removeEventListener ? m.removeEventListener('change', h) : m.removeListener(h));
  }, []);
  return sm;
};

/* ─── Motion variants ───────────────────────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
};

const rise = {
  hidden: { opacity: 0, y: 26, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.82, ease } },
};

/* ─── Component ─────────────────────────────────────────────────────────── */
export const HomeAnimated = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setActiveModal } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const isSmall = useIsSmall();
  const noMotion = Boolean(prefersReducedMotion || isSmall);
  const scopeRef = useRef(null);
  useGsapHomeAnimations({ scopeRef, disabled: noMotion });

  const [stories, setStories]   = useState([]);
  const [mapPosts, setMapPosts] = useState([]);
  const [stats, setStats]       = useState(emptySiteStats);
  const [loading, setLoading]   = useState(true);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    const h = () => loadData();
    window.addEventListener('kindnessmap:stats-updated', h);
    return () => window.removeEventListener('kindnessmap:stats-updated', h);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setMapReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, mRes, stRes] = await Promise.all([
        api.get('/posts/featured'),
        api.get('/posts/map'),
        api.get('/posts/stats'),
      ]);
      setStories(sRes.data);
      setMapPosts(mRes.data);
      setStats({ ...emptySiteStats, ...(stRes.data || {}) });
    } catch {
      /* silently ignore */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={scopeRef} className="relative flex flex-col overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════════
          CINEMATIC HERO — white background + looping video
         ═══════════════════════════════════════════════════════════════════ */}
      <section
        className="km-cinematic-hero relative min-h-screen w-full overflow-hidden flex flex-col"
      >
        {/* ── Video background layer ──────────────────────────────────────────── */}
        <CinematicVideoBackground className="km-hero-video-layer" />

        {/* ── HERO CONTENT ────────────────────────────────────────────────────── */}
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center text-center flex-1 px-6"
          style={{ paddingTop: 'calc(8rem - 75px)', paddingBottom: '10rem' }}
          variants={container}
          initial={noMotion ? false : 'hidden'}
          animate="show"
        >
          {/* ── Eyebrow badge ──────────────────────────────────────────── */}
          <motion.div
            variants={rise}
            className="animate-fade-rise inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium border border-black/10 bg-white/60 backdrop-blur-sm"
            style={{ color: '#6F6F6F' }}
          >
            <HeartHandshake className="w-3.5 h-3.5" style={{ color: '#000000' }} />
            <span style={{ fontFamily: 'var(--font-body)' }}>KindnessMap · Nền Tảng Việc Tốt · Việt Nam 2026</span>
          </motion.div>

          {/* ── Main headline ──────────────────────────────────────────── */}
          {/*
           * FONT STRATEGY:
           * - 'Be Vietnam Pro' → black/bold Vietnamese text (full diacritic support)
           * - 'Instrument Serif' italic → ONLY the short gray emphasis words
           * - Layout: two block-level <div> lines to prevent orphaned inline elements
           */}
          <motion.h1
            variants={rise}
            className="mt-7 max-w-5xl animate-fade-rise text-center"
            style={{
              lineHeight: 1.12,
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
            }}
          >
            {/* Line 1: "Biến mỗi việc tốt" [bold black] + "nhỏ bé" [italic gray] */}
            <span className="block" style={{ fontSize: 'clamp(1.9rem, 5.2vw, 4.8rem)', whiteSpace: 'nowrap' }}>
              <span
                style={{
                  color: '#000000',
                  fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
                  fontWeight: 800,
                  letterSpacing: '-1px',
                }}
              >
                Biến mỗi việc tốt{' '}
              </span>
              <span
                style={{
                  color: '#6F6F6F',
                  fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
                  fontWeight: 300,
                  fontStyle: 'italic',
                  letterSpacing: '-0.5px',
                }}
              >
                nhỏ bé
              </span>
            </span>

            {/* Line 2: "thành một" [bold black] + "điểm sáng trên bản đồ." [italic gray] */}
            <span className="block" style={{ fontSize: 'clamp(1.6rem, 4.4vw, 4.1rem)', marginTop: '0.1em', whiteSpace: 'nowrap' }}>
              <span
                style={{
                  color: '#000000',
                  fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
                  fontWeight: 800,
                  letterSpacing: '-1px',
                }}
              >
                thành một{' '}
              </span>
              <span
                style={{
                  color: '#6F6F6F',
                  fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
                  fontWeight: 300,
                  fontStyle: 'italic',
                  letterSpacing: '-0.5px',
                }}
              >
                điểm sáng trên bản đồ.
              </span>
            </span>
          </motion.h1>

          {/* ── Description ────────────────────────────────────────────── */}
          <motion.p
            variants={rise}
            className="mt-8 max-w-2xl text-base sm:text-lg leading-relaxed km-cinematic-copy animate-fade-rise-delay"
            style={{ color: '#6F6F6F' }}
          >
            Xây dựng nền tảng cho những tâm hồn nhân ái và những người đáng can đảm.
            Qua mọi ồn ào, chúng tôi tạo nên những không gian số để lan tỏa lòng tốt
            theo cách hiện đại, trực quan và truyền cảm hứng.
          </motion.p>

          {/* ── CTA Buttons ─────────────────────────────────────────────── */}
          <motion.div
            variants={rise}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-rise-delay-2"
          >
            {/* Primary CTA — black pill */}
            <motion.button
              whileHover={noMotion ? undefined : { scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { if (!isAuthenticated) setActiveModal('login'); else navigate('/submit'); }}
              className="km-hero-cta px-14 py-5 text-base"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Ghìm Việc Tốt Của Bạn
            </motion.button>

            {/* Secondary CTA — outlined */}
            <motion.button
              whileHover={noMotion ? undefined : { scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/explore')}
              className="rounded-full px-10 py-5 text-base flex items-center gap-2 border transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                color: '#000000',
                borderColor: 'rgba(0,0,0,0.2)',
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span>Khám Phá Bản Đồ</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {/* ── Live stats strip ────────────────────────────────────────────── */}
          <motion.div
            variants={rise}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl animate-fade-rise-delay-3"
          >
            {statDefinitions.map((s) => (
              <div
                key={s.key}
                className="rounded-2xl px-4 py-4 text-center"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div
                  className="text-2xl sm:text-3xl font-black tracking-tight"
                  style={{ color: '#000000', fontFamily: 'var(--font-body)' }}
                >
                  <AnimatedNumber value={stats[s.key]} disabled={noMotion} />
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold mt-1 leading-tight" style={{ color: '#6F6F6F' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Fade to page background */}
        <div
          className="absolute inset-x-0 bottom-0 z-[2]"
          style={{ height: 80, background: 'linear-gradient(to top, var(--color-background, #f8fafc), transparent)' }}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          INTERACTIVE MAP SECTION
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-8 py-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 text-brand-green font-bold text-xs uppercase tracking-widest">
              <MapPin className="w-4 h-4" />
              Bản Đồ Việc Tốt Trực Tuyến
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Khám Phá Lòng Tốt Quanh Bạn
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Theo dõi những điểm sáng tử tế, cụm hoạt động cộng đồng và các câu chuyện đang truyền cảm hứng khắp Việt Nam.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="km-panel-soft px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {mapPosts.length || 0} ghim việc tốt hiển thị trực tiếp
            </div>
            <button
              onClick={() => navigate('/explore')}
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-2"
            >
              <span>Mở Bản Đồ Toàn Màn Hình</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
        <div className="km-panel p-3 sm:p-4">
          {loading || !mapReady ? (
            <MapSkeleton />
          ) : (
            <Suspense fallback={<MapSkeleton />}>
              <LazyMapComponent
                posts={mapPosts}
                className="h-[520px] w-full rounded-[28px] overflow-hidden border border-slate-200 dark:border-slate-800"
              />
            </Suspense>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED STORIES
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-8 pb-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest">
              <Star className="w-4 h-4 fill-rose-500" />
              Câu Chuyện Lan Tỏa
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Những Câu Chuyện Truyền Cảm Hứng
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Các câu chuyện nổi bật đang nhận được nhiều yêu thích và lan tỏa tích cực từ cộng đồng.
            </p>
          </div>
          <button
            onClick={() => navigate('/stories')}
            className="font-bold text-sm text-brand-green hover:underline flex items-center gap-1"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.length === 0 ? (
            <div className="col-span-3 km-panel p-12 text-center text-slate-400 font-medium">
              Hiện chưa có câu chuyện nổi bật nào.
            </div>
          ) : (
            stories.map((story) => (
              <motion.article
                key={story.id}
                id={`home-story-${story.id}`}
                onClick={() => navigate(`/stories?id=${story.id}`)}
                initial={noMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-70px' }}
                transition={{ duration: 0.52, ease }}
                whileHover={noMotion ? undefined : { y: -6, scale: 1.01 }}
                className="km-panel overflow-hidden group cursor-pointer km-gsap-card"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/stories?id=${story.id}`); }}
              >
                <div className="relative h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={story.imageUrl || FALLBACK_IMAGE}
                    alt={story.title}
                    loading="lazy"
                    decoding="async"
                    onError={applyFallback}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 bg-white/95 dark:bg-slate-900/95 rounded-full text-xs font-bold text-brand-deepGreen shadow">
                    {story.category}
                  </span>
                </div>
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>📍 {story.locationName}</span>
                    <span>📅 {new Date(story.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-brand-green transition-colors leading-snug line-clamp-2">
                    {story.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {story.description}
                  </p>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={story.authorAvatar || FALLBACK_IMAGE}
                        alt={story.authorName}
                        loading="lazy"
                        onError={applyFallback}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-black/5"
                      />
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-100">{story.authorName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                        {story.likesCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-brand-blue" />
                        {story.commentsCount}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          GAMIFICATION / JOURNEY SECTION
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-20">
        <div className="relative overflow-hidden rounded-[32px] py-16 px-6 sm:px-10 lg:px-14 shadow-2xl border border-emerald-900/30"
          style={{ background: 'linear-gradient(135deg, #0a2a1a 0%, #0f3d28 50%, #0d2b35 100%)' }}>
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_35%)] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto gap-4">
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest">
              🏆 Hệ Thống Điểm Công Dân Số
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Gieo Mầm Lòng Tốt – Nhận Quả Ngọt
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
              Mỗi hành động tử tế của bạn đều có giá trị. KindnessMap ghi nhận và trao tặng bạn những danh hiệu cao quý cùng phần thưởng hàng tháng từ cộng đồng.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8 w-full text-left">
              {journeySteps.map((step) => (
                <div
                  key={step.n}
                  className="rounded-2xl bg-white/8 border border-white/10 backdrop-blur-md p-6 flex flex-col gap-2"
                >
                  <span className={`w-8 h-8 rounded-xl ${step.cls} text-white font-black flex items-center justify-center text-sm`}>
                    {step.n}
                  </span>
                  <h4 className="font-bold text-sm text-white mt-1">{step.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/leaderboard')}
              className="mt-8 px-8 py-3.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-emerald-50 transition-colors flex items-center gap-2"
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

export default HomeAnimated;