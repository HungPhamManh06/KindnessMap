import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Heart,
  MessageSquare,
  PlusCircle,
  Trophy,
  Star,
  Users,
  MapPinned,
  Navigation,
  HeartHandshake,
} from 'lucide-react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { CinematicVideoBackground } from '../components/CinematicVideoBackground';
import { useGsapHomeAnimations } from '../hooks/useGsapHomeAnimations';

const LazyMapComponent = lazy(() =>
  import('../components/MapComponent').then((module) => ({ default: module.MapComponent }))
);

const statDefinitions = [
  { key: 'pinnedGoodDeeds', label: 'Việc Tốt Đã Được Ghim' },
  { key: 'activeCitizens', label: 'Công Dân Tích Cực' },
  { key: 'kindnessPoints', label: 'Điểm Việc Tốt Tích Lũy' },
  { key: 'coveredCities', label: 'Tỉnh / Thành Phố Phủ Sóng' },
];

const emptySiteStats = {
  pinnedGoodDeeds: 0,
  activeCitizens: 0,
  kindnessPoints: 0,
  coveredCities: 0,
};

const FALLBACK_STORY_IMAGE =
  'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%201200%20700%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20x2%3D%271%27%20y1%3D%270%27%20y2%3D%271%27%3E%3Cstop%20stop-color%3D%27%2310b981%27%2F%3E%3Cstop%20offset%3D%270.55%27%20stop-color%3D%27%230f766e%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%230f172a%27%2F%3E%3C%2FlinearGradient%3E%3CradialGradient%20id%3D%27r%27%20cx%3D%2750%25%27%20cy%3D%2735%25%27%20r%3D%2760%25%27%3E%3Cstop%20stop-color%3D%27%23ffffff%27%20stop-opacity%3D%270.22%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%23ffffff%27%20stop-opacity%3D%270%27%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%271200%27%20height%3D%27700%27%20fill%3D%27url(%23g)%27%2F%3E%3Crect%20width%3D%271200%27%20height%3D%27700%27%20fill%3D%27url(%23r)%27%2F%3E%3Cg%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-width%3D%2718%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20opacity%3D%270.92%27%20transform%3D%27translate(510%20225)%20scale(3.3)%27%3E%3Cpath%20d%3D%27M20.8%204.6a5.5%205.5%200%200%200-7.8%200L12%205.7l-1-1.1a5.5%205.5%200%200%200-7.8%207.8l1%201L12%2021l7.8-7.6%201-1a5.5%205.5%200%200%200%200-7.8z%27%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%27600%27%20y%3D%27525%27%20text-anchor%3D%27middle%27%20font-family%3D%27Inter%2CArial%2Csans-serif%27%20font-size%3D%2756%27%20font-weight%3D%27800%27%20fill%3D%27%23ffffff%27%3EKindnessMap%3C%2Ftext%3E%3C%2Fsvg%3E';

const applyFallbackImage = (event) => {
  if (event.currentTarget.dataset.fallbackApplied === 'true') return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = FALLBACK_STORY_IMAGE;
};

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

const MapSkeleton = () => (
  <div className="h-[560px] w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-[28px] flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">
    🗺️ Đang chuẩn bị bản đồ tương tác...
  </div>
);

const useIsSmallScreen = (query = '(max-width: 767px)') => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia(query);
    const handleChange = () => setMatches(media.matches);
    handleChange();
    if (media.addEventListener) media.addEventListener('change', handleChange);
    else media.addListener(handleChange);
    return () => {
      if (media.removeEventListener) media.removeEventListener('change', handleChange);
      else media.removeListener(handleChange);
    };
  }, [query]);

  return matches;
};

const easeOutExpo = [0.16, 1, 0.3, 1];

const motionContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const motionRise = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: easeOutExpo },
  },
};

const motionScale = {
  hidden: { opacity: 0, scale: 0.94, y: 24, filter: 'blur(12px)' },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: easeOutExpo },
  },
};

export const HomeAnimated = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setActiveModal } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const isSmallScreen = useIsSmallScreen();
  const shouldReduceHomeMotion = Boolean(shouldReduceMotion || isSmallScreen);
  const enableParallax = !shouldReduceHomeMotion;
  const homeScopeRef = useRef(null);
  useGsapHomeAnimations({ scopeRef: homeScopeRef, disabled: shouldReduceHomeMotion });

  const heroMouseX = useMotionValue(0);
  const heroMouseY = useMotionValue(0);
  const smoothHeroX = useSpring(heroMouseX, { stiffness: 90, damping: 24 });
  const smoothHeroY = useSpring(heroMouseY, { stiffness: 90, damping: 24 });
  const heroRotateY = useTransform(smoothHeroX, [-0.5, 0.5], [-6, 6]);
  const heroRotateX = useTransform(smoothHeroY, [-0.5, 0.5], [5, -5]);

  const [featuredStories, setFeaturedStories] = useState([]);
  const [mapPosts, setMapPosts] = useState([]);
  const [siteStats, setSiteStats] = useState(emptySiteStats);
  const [loading, setLoading] = useState(true);
  const [enableMap, setEnableMap] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const handleStatsUpdated = () => fetchInitialData();
    window.addEventListener('kindnessmap:stats-updated', handleStatsUpdated);
    return () => window.removeEventListener('kindnessmap:stats-updated', handleStatsUpdated);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setEnableMap(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [storiesRes, mapRes, statsRes] = await Promise.all([
        api.get('/posts/featured'),
        api.get('/posts/map'),
        api.get('/posts/stats'),
      ]);
      setFeaturedStories(storiesRes.data);
      setMapPosts(mapRes.data);
      setSiteStats({ ...emptySiteStats, ...(statsRes.data || {}) });
    } catch (error) {
      console.error('Failed to fetch home data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={homeScopeRef} className="relative flex flex-col gap-20 pb-16 overflow-x-hidden km-modern-home">
      {/* Aurora background orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="km-aurora-orb km-aurora-orb-1 km-gsap-orb" />
        <div className="km-aurora-orb km-aurora-orb-2 km-gsap-orb" />
        <div className="km-aurora-orb km-aurora-orb-3 km-gsap-orb" />
        <div className="absolute inset-0 opacity-[0.055] dark:opacity-[0.08] km-grid-bg" />
      </div>

      {/* ── HERO SECTION ──────────────────────────────────────────────────── */}
      <section
        className="relative px-4 sm:px-6 lg:px-8 max-w-[1500px] mx-auto w-full pt-8 lg:pt-12"
        onMouseMove={(e) => {
          if (!enableParallax) return;
          const rect = e.currentTarget.getBoundingClientRect();
          heroMouseX.set((e.clientX - rect.left) / rect.width - 0.5);
          heroMouseY.set((e.clientY - rect.top) / rect.height - 0.5);
        }}
        onMouseLeave={() => {
          heroMouseX.set(0);
          heroMouseY.set(0);
        }}
      >
        <div className="relative min-h-[calc(100vh-9rem)] overflow-hidden rounded-[2rem] sm:rounded-[3rem] border border-white/10 bg-slate-950 text-white shadow-[0_35px_120px_-55px_rgba(16,185,129,0.8)]">

          {/* Cinematic looping video — starts at 300px from top */}
          <CinematicVideoBackground
            className="inset-x-0 bottom-0 top-[300px] z-0 opacity-90"
          />

          {/* Dark brand gradient overlay above video */}
          <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.28),transparent_30%),radial-gradient(circle_at_78%_15%,rgba(20,184,166,0.2),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.9),rgba(2,6,23,0.92)_50%,rgba(2,6,23,0.68))]" />

          {/* Subtle grid texture */}
          <div className="absolute inset-0 z-[2] km-grid-bg opacity-[0.07]" />

          {/* Top shimmer line */}
          <div className="absolute left-1/2 top-0 z-[3] h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

          {/* ── CENTERED CINEMATIC HERO CONTENT ──────────────────────────── */}
          <motion.div
            className="relative z-10 flex flex-col items-center justify-center text-center min-h-[calc(100vh-9rem)] px-6"
            style={{ paddingTop: 'calc(8rem - 75px)', paddingBottom: '10rem' }}
            variants={motionContainer}
            initial={shouldReduceHomeMotion ? false : 'hidden'}
            animate="show"
          >
            {/* Eyebrow badge */}
            <motion.div
              variants={motionRise}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-emerald-400/25 text-emerald-200 text-xs sm:text-sm font-extrabold shadow-2xl shadow-emerald-500/10 backdrop-blur-xl animate-fade-in km-gsap-eyebrow"
            >
              <HeartHandshake className="w-4 h-4 text-emerald-300" />
              <span>Social Good Platform · Việt Nam 2026</span>
            </motion.div>

            {/* Main headline — Instrument Serif, cinematic sizing */}
            <motion.h1
              variants={motionRise}
              className="mt-8 max-w-6xl km-cinematic-title text-5xl sm:text-7xl md:text-8xl animate-fade-rise"
              style={{ color: '#ffffff' }}
            >
              {/* Line 1 — white */}
              <span className="block overflow-visible pb-2">
                <motion.span
                  className="inline-block km-gsap-title-word"
                  initial={false}
                  animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0 }}
                >
                  Biến mỗi
                </motion.span>
              </span>

              {/* Line 2 — italic emerald accent */}
              <span className="block overflow-visible pb-2 text-emerald-300 drop-shadow-[0_0_32px_rgba(52,211,153,0.35)] italic">
                <motion.span
                  className="inline-block km-gsap-title-word"
                  initial={false}
                  animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0 }}
                >
                  việc tốt nhỏ bé
                </motion.span>
              </span>

              {/* Line 3 — white */}
              <span className="block overflow-visible pb-2">
                <motion.span
                  className="inline-block km-gsap-title-word"
                  initial={false}
                  animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0 }}
                >
                  thành
                </motion.span>
              </span>

              {/* Line 4 — cyan accent */}
              <span className="block overflow-visible pb-2 text-cyan-200 drop-shadow-[0_0_28px_rgba(103,232,249,0.25)]">
                <motion.span
                  className="inline-block km-gsap-title-word"
                  initial={false}
                  animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0 }}
                >
                  một điểm sáng trên bản đồ.
                </motion.span>
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={motionRise}
              className="mt-8 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-300 km-cinematic-copy km-gsap-copy animate-fade-rise-delay"
            >
              KindnessMap kết hợp bản đồ trực tuyến, câu chuyện cộng đồng, điểm công dân số và AI để
              lan tỏa lòng tốt theo cách hiện đại, trực quan và truyền cảm hứng.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={motionRise}
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 km-gsap-cta animate-fade-rise-delay-2"
            >
              {/* Primary CTA */}
              <motion.button
                whileHover={shouldReduceHomeMotion ? undefined : { y: -4, scale: 1.035 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (!isAuthenticated) setActiveModal('login');
                  else navigate('/submit');
                }}
                className="group relative overflow-hidden km-shimmer rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 px-14 py-5 text-slate-950 font-black text-base shadow-[0_20px_60px_-18px_rgba(52,211,153,0.9)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-[120%] transition-transform duration-700" />
                <PlusCircle className="relative w-5 h-5 group-hover:rotate-90 transition-transform" />
                <span className="relative">Ghim Việc Tốt Của Bạn</span>
              </motion.button>

              {/* Secondary CTA */}
              <motion.button
                whileHover={shouldReduceHomeMotion ? undefined : { y: -4, scale: 1.035 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/explore')}
                className="px-10 py-5 rounded-full bg-white/8 hover:bg-white/14 text-white font-extrabold text-base border border-white/15 backdrop-blur-xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Khám Phá Bản Đồ</span>
                <ArrowRight className="w-5 h-5 text-emerald-300" />
              </motion.button>
            </motion.div>

            {/* Audience tags */}
            <motion.div
              variants={motionRise}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              {['👨‍🎓 Sinh viên tích cực', '💚 Tình nguyện viên', '🏡 Cư dân địa phương', '🏢 CLB & Câu lạc bộ'].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-full border border-emerald-400/20 bg-white/[0.06] px-4 py-2 text-xs sm:text-sm font-bold text-slate-200 backdrop-blur-xl km-gsap-pill hover:border-emerald-400/40 hover:bg-white/10 transition-all"
                  >
                    {item}
                  </div>
                )
              )}
            </motion.div>

            {/* Live stats strip */}
            <motion.div
              variants={motionRise}
              className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl"
            >
              {statDefinitions.map((stat) => (
                <div
                  key={stat.key}
                  className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 backdrop-blur-xl text-center"
                >
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    <AnimatedNumber value={siteStats[stat.key]} disabled={shouldReduceHomeMotion} />
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-bold mt-1 leading-tight">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── INTERACTIVE MAP SECTION ──────────────────────────────────────── */}
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
              Theo dõi những điểm sáng tử tế, cụm hoạt động cộng đồng và các câu chuyện đang truyền
              cảm hứng khắp Việt Nam ngay trên bản đồ tương tác.
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
          {loading || !enableMap ? (
            <MapSkeleton />
          ) : (
            <Suspense fallback={<MapSkeleton />}>
              <LazyMapComponent
                posts={mapPosts}
                className="h-[560px] w-full rounded-[28px] overflow-hidden shadow-none border border-slate-200 dark:border-slate-800"
              />
            </Suspense>
          )}
        </div>
      </section>

      {/* ── FEATURED STORIES SECTION ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 km-gsap-reveal">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 text-rose-500 font-extrabold text-xs uppercase tracking-wider">
              <Star className="w-4 h-4 fill-rose-500" /> Câu Chuyện Lan Tỏa
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Những Câu Chuyện Truyền Cảm Hứng
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Các câu chuyện nổi bật đang nhận được nhiều yêu thích, bình luận và lan tỏa tích cực từ
              cộng đồng KindnessMap.
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
              <motion.article
                key={story.id}
                id={`home-story-${story.id}`}
                onClick={() => navigate(`/stories?id=${story.id}`)}
                initial={shouldReduceHomeMotion ? false : { opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-70px' }}
                transition={{ duration: 0.55, ease: easeOutExpo }}
                whileHover={shouldReduceHomeMotion ? undefined : { y: -8, scale: 1.01 }}
                className="km-panel overflow-hidden group hover:-translate-y-1 transition-all duration-300 cursor-pointer km-gsap-card km-gsap-magnetic"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') navigate(`/stories?id=${story.id}`);
                }}
              >
                <div className="relative h-56 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={story.imageUrl || FALLBACK_STORY_IMAGE}
                    alt={story.title}
                    loading="lazy"
                    decoding="async"
                    onError={applyFallbackImage}
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
                      <img
                        src={story.authorAvatar || FALLBACK_STORY_IMAGE}
                        alt={story.authorName}
                        loading="lazy"
                        decoding="async"
                        onError={applyFallbackImage}
                        className="w-8 h-8 rounded-full object-cover bg-slate-200 dark:bg-slate-700 ring-1 ring-black/5 dark:ring-white/5"
                      />
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                        {story.authorName}
                      </span>
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
              </motion.article>
            ))
          )}
        </div>
      </section>

      {/* ── JOURNEY / GAMIFICATION SECTION ──────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-slate-900 text-white py-16 px-6 sm:px-10 lg:px-14 rounded-[32px] relative overflow-hidden shadow-2xl border border-slate-800 km-gsap-reveal">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-green/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_30%)] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto gap-4">
            <span className="text-emerald-400 font-extrabold text-xs uppercase tracking-widest">
              🏆 Hệ Thống Điểm Công Dân Số
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Gieo Mầm Lòng Tốt – Nhận Quả Ngọt
            </h2>
            <p className="text-slate-300 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-3xl">
              Mỗi hành động tử tế của bạn, dù nhỏ bé nhất, đều có giá trị to lớn. KindnessMap ghi nhận
              và trao tặng bạn những danh hiệu cao quý cùng phần thưởng hàng tháng từ cộng đồng.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 w-full text-left">
              {journeySteps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-2xl bg-white/10 dark:bg-slate-800/60 border border-white/10 backdrop-blur-md p-6 flex flex-col gap-2"
                >
                  <span
                    className={`w-8 h-8 rounded-xl ${step.badgeClass} text-white font-black flex items-center justify-center text-sm`}
                  >
                    {step.number}
                  </span>
                  <h4 className="font-bold text-sm text-white mt-1">{step.title}</h4>
                  <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
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

export default HomeAnimated;
