import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Sparkles, MapPin, Heart, MessageSquare, PlusCircle, Trophy, Star, Users, MapPinned, Navigation } from 'lucide-react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { useGsapHomeAnimations } from '../hooks/useGsapHomeAnimations';

const LazyMapComponent = lazy(() => import('../components/MapComponent').then((module) => ({ default: module.MapComponent })));

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

const formatStatValue = (value) => Number(value || 0).toLocaleString('en-US');

const audiences = ['👨‍🎓 Sinh viên tích cực', '💚 Tình nguyện viên', '🏡 Cư dân địa phương', '🏢 Câu lạc bộ & CLB'];

const FALLBACK_STORY_IMAGE = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%201200%20700%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20x2%3D%271%27%20y1%3D%270%27%20y2%3D%271%27%3E%3Cstop%20stop-color%3D%27%2310b981%27%2F%3E%3Cstop%20offset%3D%270.55%27%20stop-color%3D%27%230f766e%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%230f172a%27%2F%3E%3C%2FlinearGradient%3E%3CradialGradient%20id%3D%27r%27%20cx%3D%2750%25%27%20cy%3D%2735%25%27%20r%3D%2760%25%27%3E%3Cstop%20stop-color%3D%27%23ffffff%27%20stop-opacity%3D%270.22%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%23ffffff%27%20stop-opacity%3D%270%27%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%271200%27%20height%3D%27700%27%20fill%3D%27url(%23g)%27%2F%3E%3Crect%20width%3D%271200%27%20height%3D%27700%27%20fill%3D%27url(%23r)%27%2F%3E%3Cg%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-width%3D%2718%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20opacity%3D%270.92%27%20transform%3D%27translate(510%20225)%20scale(3.3)%27%3E%3Cpath%20d%3D%27M20.8%204.6a5.5%205.5%200%200%200-7.8%200L12%205.7l-1-1.1a5.5%205.5%200%200%200-7.8%207.8l1%201L12%2021l7.8-7.6%201-1a5.5%205.5%200%200%200%200-7.8z%27%2F%3E%3Cpath%20d%3D%27M12%205.7l-2.6%202.6a2%202%200%200%200%200%202.8l.2.2a2%202%200%200%200%202.8%200L14%209.8%27%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%27600%27%20y%3D%27525%27%20text-anchor%3D%27middle%27%20font-family%3D%27Inter%2CArial%2Csans-serif%27%20font-size%3D%2756%27%20font-weight%3D%27800%27%20fill%3D%27%23ffffff%27%3EKindnessMap%3C%2Ftext%3E%3Ctext%20x%3D%27600%27%20y%3D%27590%27%20text-anchor%3D%27middle%27%20font-family%3D%27Inter%2CArial%2Csans-serif%27%20font-size%3D%2728%27%20font-weight%3D%27600%27%20fill%3D%27%23d1fae5%27%3EB%E1%BA%A3n%20%C4%90%E1%BB%93%20Vi%E1%BB%87c%20T%E1%BB%91t%3C%2Ftext%3E%3C%2Fsvg%3E';

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
      staggerChildren: 0.09,
      delayChildren: 0.08,
    },
  },
};

const motionRise = {
  hidden: { opacity: 0, y: 32, filter: 'blur(10px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.78, ease: easeOutExpo },
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
  const heroTitleLine1 = ['Biến', 'mỗi', 'việc', 'tốt', 'thành'];
  const heroTitleLine2 = ['một', 'điểm', 'sáng', 'trên', 'bản', 'đồ.'];

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
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="km-aurora-orb km-aurora-orb-1 km-gsap-orb" />
        <div className="km-aurora-orb km-aurora-orb-2 km-gsap-orb" />
        <div className="km-aurora-orb km-aurora-orb-3 km-gsap-orb" />
        <div className="absolute inset-0 opacity-[0.055] dark:opacity-[0.08] km-grid-bg" />
      </div>

      <section className="relative px-4 sm:px-6 lg:px-8 max-w-[1500px] mx-auto w-full pt-8 lg:pt-12">
        <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] border border-white/10 bg-slate-950 text-white shadow-[0_35px_120px_-55px_rgba(16,185,129,0.8)]" onMouseMove={(event) => { if (!enableParallax) return; const rect = event.currentTarget.getBoundingClientRect(); heroMouseX.set((event.clientX - rect.left) / rect.width - 0.5); heroMouseY.set((event.clientY - rect.top) / rect.height - 0.5); }} onMouseLeave={() => { heroMouseX.set(0); heroMouseY.set(0); }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.32),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(20,184,166,0.24),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(2,6,23,0.98))]" />
          <div className="absolute inset-0 km-grid-bg opacity-[0.08]" />
          <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />

          <motion.div className="relative z-10 grid lg:grid-cols-[1.03fr_0.97fr] gap-10 lg:gap-12 items-center px-5 sm:px-9 lg:px-14 py-12 sm:py-16 lg:py-20" variants={motionContainer} initial={shouldReduceHomeMotion ? false : "hidden"} animate="show">
            <motion.div className="flex flex-col items-start text-left" variants={motionContainer}>
              <motion.div variants={motionRise} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 border border-white/15 text-emerald-100 text-xs sm:text-sm font-extrabold shadow-2xl shadow-emerald-500/10 backdrop-blur-xl animate-fade-in km-gsap-eyebrow">
                <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
                <span>Social Good Platform · Việt Nam 2026</span>
              </motion.div>

              <motion.h1 variants={motionRise} className="mt-7 text-4xl sm:text-6xl xl:text-7xl font-black tracking-[-0.055em] leading-[0.95] max-w-5xl">
                <span className="block">
                  {heroTitleLine1.map((word, index) => (
                    <motion.span
                      key={word}
                      className="inline-block mr-[0.18em] km-gsap-title-word"
                      initial={false}
                      animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0 }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </span>
                <span className="block mt-2 text-emerald-100 drop-shadow-[0_0_28px_rgba(45,212,191,0.22)] km-hero-gradient-safe">
                  {heroTitleLine2.map((word, index) => (
                    <motion.span
                      key={word}
                      className="inline-block mr-[0.18em] km-gsap-title-word"
                      initial={false}
                      animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0 }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </span>
              </motion.h1>

              <motion.p variants={motionRise} className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl leading-relaxed km-gsap-copy">
                KindnessMap kết hợp bản đồ trực tuyến, câu chuyện cộng đồng, điểm công dân số và AI để lan tỏa lòng tốt theo cách hiện đại, trực quan và truyền cảm hứng.
              </motion.p>

              <motion.div variants={motionRise} className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto km-gsap-cta">
                <motion.button
                  whileHover={shouldReduceHomeMotion ? undefined : { y: -4, scale: 1.035 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (!isAuthenticated) setActiveModal('login');
                    else navigate('/submit');
                  }}
                  className="group relative overflow-hidden km-shimmer px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-black text-base shadow-[0_18px_55px_-18px_rgba(45,212,191,0.95)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover:translate-x-[120%] transition-transform duration-700" />
                  <PlusCircle className="relative w-5 h-5 group-hover:rotate-90 transition-transform" />
                  <span className="relative">Ghim Việc Tốt Của Bạn</span>
                </motion.button>

                <motion.button
                  whileHover={shouldReduceHomeMotion ? undefined : { y: -4, scale: 1.035 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/explore')}
                  className="px-7 py-4 rounded-2xl bg-white/8 hover:bg-white/12 text-white font-extrabold text-base border border-white/15 backdrop-blur-xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Khám Phá Bản Đồ</span>
                  <ArrowRight className="w-5 h-5 text-emerald-300 group-hover:translate-x-1" />
                </motion.button>
              </motion.div>

              <motion.div variants={motionRise} className="mt-9 flex flex-wrap gap-3">
                {audiences.map((item) => (
                  <div key={item} className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs sm:text-sm font-bold text-slate-200 backdrop-blur-xl km-gsap-pill">
                    {item}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div variants={motionScale} style={enableParallax ? { rotateX: heroRotateX, rotateY: heroRotateY, transformPerspective: 1200 } : undefined} className="relative min-h-[520px] lg:min-h-[610px] km-gsap-map-card">
              <div className="absolute inset-4 rounded-[2.5rem] bg-gradient-to-br from-emerald-400/20 via-cyan-400/10 to-purple-500/20 blur-3xl" />

              <div className="relative h-full rounded-[2rem] border border-white/12 bg-white/[0.07] p-4 sm:p-5 backdrop-blur-2xl shadow-2xl overflow-hidden km-float-slow">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_38%)]" />
                <div className="relative rounded-[1.5rem] overflow-hidden border border-white/10 bg-slate-900/80 h-[300px] sm:h-[360px]">
                  {loading || !enableMap ? (
                    <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold bg-slate-900/80">
                      Đang tải bản đồ sống...
                    </div>
                  ) : (
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-slate-400 font-bold">Đang tải bản đồ sống...</div>}>
                      <LazyMapComponent posts={mapPosts} className="h-full w-full overflow-hidden" />
                    </Suspense>
                  )}
                  <div className="absolute left-4 top-4 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-xs font-black text-emerald-200">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                      </span>
                      LIVE KINDNESS MAP
                    </div>
                    <div className="mt-1 text-[11px] text-slate-300">{mapPosts.length || 0} điểm tốt đang hiển thị</div>
                  </div>
                </div>

                <div className="relative grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/55 p-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <MapPinned className="w-5 h-5 text-emerald-300" />
                      <span className="text-[10px] font-black text-emerald-200 uppercase tracking-wider">Pins</span>
                    </div>
                    <div className="mt-4 text-3xl font-black tracking-tight"><AnimatedNumber value={siteStats.pinnedGoodDeeds} disabled={shouldReduceHomeMotion} /></div>
                    <div className="text-[11px] text-slate-400 font-bold">Việc tốt đã ghim</div>
                  </div>

                  <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/55 p-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <Users className="w-5 h-5 text-cyan-300" />
                      <span className="text-[10px] font-black text-cyan-200 uppercase tracking-wider">Community</span>
                    </div>
                    <div className="mt-4 text-3xl font-black tracking-tight"><AnimatedNumber value={siteStats.activeCitizens} disabled={shouldReduceHomeMotion} /></div>
                    <div className="text-[11px] text-slate-400 font-bold">Công dân tích cực</div>
                  </div>
                </div>

                <div className="relative mt-3 rounded-[1.35rem] border border-white/10 bg-gradient-to-r from-emerald-400/15 to-cyan-400/10 p-4 backdrop-blur-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-black text-emerald-200 uppercase tracking-wider">AI Ghép Nối</div>
                    <div className="mt-1 text-sm font-bold text-white">Gợi ý người cần giúp ↔ người có thể hỗ trợ</div>
                  </div>
                  <button onClick={() => navigate('/matching')} className="shrink-0 w-11 h-11 rounded-2xl bg-white text-slate-950 flex items-center justify-center hover:scale-105 transition-transform">
                    <Navigation className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="hidden sm:block absolute -left-3 bottom-20 rounded-3xl border border-white/15 bg-slate-950/70 px-4 py-3 backdrop-blur-2xl shadow-2xl km-float-medium">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-black">Điểm tích lũy</div>
                <div className="text-2xl font-black text-white"><AnimatedNumber value={siteStats.kindnessPoints} disabled={shouldReduceHomeMotion} /></div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 max-w-[1500px] mx-auto w-full -mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statDefinitions.map((stat, index) => (
            <motion.div key={stat.key} initial={shouldReduceHomeMotion ? false : { opacity: 0, y: 24, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.55, delay: index * 0.06, ease: easeOutExpo }} whileHover={shouldReduceHomeMotion ? undefined : { y: -8, rotateX: 1.2, rotateY: -1.2 }} className="km-stat-card km-magnetic-card km-gsap-card km-gsap-magnetic group p-5 sm:p-6 text-center">
              <div className="text-3xl sm:text-5xl font-black tracking-[-0.04em] bg-gradient-to-r from-slate-950 to-emerald-700 bg-clip-text text-transparent dark:from-white dark:to-emerald-200">
                <AnimatedNumber value={siteStats[stat.key]} disabled={shouldReduceHomeMotion} />
              </div>
              <div className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mt-3">
                {stat.label}
              </div>
              <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${Math.min(95, 42 + index * 14)}%` }} />
              </div>
            </motion.div>
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
          {loading || !enableMap ? (
            <MapSkeleton />
          ) : (
            <Suspense fallback={<MapSkeleton />}>
              <LazyMapComponent posts={mapPosts} className="h-[560px] w-full rounded-[28px] overflow-hidden shadow-none border border-slate-200 dark:border-slate-800" />
            </Suspense>
          )}
        </div>
      </section>

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
              <motion.article
                key={story.id}
                id={`home-story-${story.id}`}
                onClick={() => navigate(`/stories?id=${story.id}`)}
                initial={shouldReduceHomeMotion ? false : { opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-70px" }}
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
                      <img src={story.authorAvatar || FALLBACK_STORY_IMAGE} alt={story.authorName} loading="lazy" decoding="async" onError={applyFallbackImage} className="w-8 h-8 rounded-full object-cover bg-slate-200 dark:bg-slate-700 ring-1 ring-black/5 dark:ring-white/5" />
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
              </motion.article>
            ))
          )}
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-slate-900 text-white py-16 px-6 sm:px-10 lg:px-14 rounded-[32px] relative overflow-hidden shadow-2xl border border-slate-800 km-gsap-reveal">
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

export default HomeAnimated;
