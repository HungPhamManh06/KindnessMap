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
  Users,
  Zap,
  Globe,
  CheckCircle,
  Upload,
  Award,
  Sparkles,
} from 'lucide-react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { CinematicVideoBackground } from '../components/CinematicVideoBackground';
import { useGsapHomeAnimations } from '../hooks/useGsapHomeAnimations';

const LazyMapComponent = lazy(() =>
  import('../components/MapComponent').then((m) => ({ default: m.MapComponent }))
);

/* ─── Constants ────────────────────────────────────────────────────────── */
const statDefinitions = [
  {
    key: 'pinnedGoodDeeds',
    label: 'Việc Tốt Đã Ghim',
    icon: MapPin,
    accent: '#10b981',
    bgFrom: 'rgba(16,185,129,0.10)',
    bgTo: 'rgba(16,185,129,0.02)',
  },
  {
    key: 'activeCitizens',
    label: 'Công Dân Tích Cực',
    icon: Users,
    accent: '#0ea5e9',
    bgFrom: 'rgba(14,165,233,0.10)',
    bgTo: 'rgba(14,165,233,0.02)',
  },
  {
    key: 'kindnessPoints',
    label: 'Điểm Tích Lũy',
    icon: Zap,
    accent: '#f59e0b',
    bgFrom: 'rgba(245,158,11,0.10)',
    bgTo: 'rgba(245,158,11,0.02)',
  },
  {
    key: 'coveredCities',
    label: 'Tỉnh / Thành Phố',
    icon: Globe,
    accent: '#8b5cf6',
    bgFrom: 'rgba(139,92,246,0.10)',
    bgTo: 'rgba(139,92,246,0.02)',
  },
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

const howItWorksSteps = [
  {
    n: '01',
    icon: Heart,
    title: 'Làm Việc Tốt',
    desc: 'Nhặt rác, giúp người già, hiến máu hay tổ chức dạy học miễn phí.',
    color: '#10b981',
  },
  {
    n: '02',
    icon: Upload,
    title: 'Ghim Lên Bản Đồ',
    desc: 'Đăng bài cùng hình ảnh thực tế và chọn vị trí chính xác trên bản đồ.',
    color: '#0ea5e9',
  },
  {
    n: '03',
    icon: Award,
    title: 'Thăng Hạng & Huy Hiệu',
    desc: 'Tích lũy 10–50 điểm mỗi bài, nhận huy hiệu Hiệp Sĩ và giải thưởng tháng.',
    color: '#f59e0b',
  },
];

/* ─── Particles for community banner ───────────────────────────────────── */
const PARTICLES = [
  { size: 6,  left: '8%',  bottom: '12%', delay: '0s',   duration: '5.5s', color: 'rgba(52,211,153,0.7)' },
  { size: 4,  left: '18%', bottom: '20%', delay: '1.2s', duration: '6.8s', color: 'rgba(34,211,238,0.6)' },
  { size: 8,  left: '30%', bottom: '8%',  delay: '0.4s', duration: '7.2s', color: 'rgba(52,211,153,0.5)' },
  { size: 5,  left: '45%', bottom: '15%', delay: '2.1s', duration: '5.9s', color: 'rgba(255,255,255,0.5)' },
  { size: 7,  left: '60%', bottom: '6%',  delay: '0.8s', duration: '8.1s', color: 'rgba(34,211,238,0.55)' },
  { size: 4,  left: '72%', bottom: '22%', delay: '1.6s', duration: '6.4s', color: 'rgba(52,211,153,0.65)' },
  { size: 6,  left: '85%', bottom: '10%', delay: '0.2s', duration: '7.7s', color: 'rgba(255,255,255,0.45)' },
  { size: 5,  left: '93%', bottom: '18%', delay: '2.8s', duration: '5.2s', color: 'rgba(34,211,238,0.7)' },
];

const MapSkeleton = () => (
  <div className="h-[520px] w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-[28px] flex items-center justify-center text-slate-500 dark:text-slate-400 font-semibold">
    🗺️ Đang chuẩn bị bản đồ tương tác...
  </div>
);

/* Shimmer skeleton for story cards */
const StorySkeleton = () => (
  <div className="km-panel overflow-hidden">
    <div className="h-52 km-skeleton-shimmer" style={{ borderRadius: 0 }} />
    <div className="p-5 flex flex-col gap-3">
      <div className="flex justify-between">
        <div className="h-3 w-24 km-skeleton-shimmer" />
        <div className="h-3 w-20 km-skeleton-shimmer" />
      </div>
      <div className="h-5 w-full km-skeleton-shimmer" />
      <div className="h-4 w-4/5 km-skeleton-shimmer" />
      <div className="h-4 w-3/5 km-skeleton-shimmer" />
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full km-skeleton-shimmer" />
          <div className="h-3 w-20 km-skeleton-shimmer" />
        </div>
        <div className="h-3 w-16 km-skeleton-shimmer" />
      </div>
    </div>
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
  // Tránh animate CSS filter/blur vì filter khá nặng và có thể làm cuộn bị khựng.
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.72, ease } },
};

const sectionReveal = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
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
      <section className="km-cinematic-hero relative min-h-screen w-full overflow-hidden flex flex-col">
        <CinematicVideoBackground className="km-hero-video-layer" />

        <motion.div
          className="relative z-10 flex flex-col items-center justify-center text-center flex-1 px-6"
          style={{ paddingTop: 'calc(8rem - 75px)', paddingBottom: '10rem' }}
          variants={container}
          initial={noMotion ? false : 'hidden'}
          animate="show"
        >
          {/* Eyebrow badge */}
          <motion.div
            variants={rise}
            className="animate-fade-rise inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium border border-black/10 bg-white/60 backdrop-blur-sm"
            style={{ color: '#6F6F6F' }}
          >
            <HeartHandshake className="w-3.5 h-3.5" style={{ color: '#000000' }} />
            <span style={{ fontFamily: 'var(--font-body)' }}>KindnessMap · Nền Tảng Việc Tốt · Việt Nam 2026</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            variants={rise}
            className="mt-7 max-w-5xl animate-fade-rise text-center"
            style={{ lineHeight: 1.12, textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased' }}
          >
            <span className="block" style={{ fontSize: 'clamp(1.7rem, 4.6vw, 4.2rem)', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#000000', fontFamily: "'Be Vietnam Pro', system-ui, sans-serif", fontWeight: 800, fontStyle: 'normal', letterSpacing: '-1px' }}>
                Biến mỗi việc tốt{' '}
              </span>
              <span style={{ color: '#000000', fontFamily: "'Be Vietnam Pro', system-ui, sans-serif", fontWeight: 800, fontStyle: 'normal', letterSpacing: '-1px' }}>
                nhỏ bé
              </span>
            </span>
            <span className="block" style={{ fontSize: 'clamp(1.4rem, 3.9vw, 3.6rem)', marginTop: '0.1em', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#000000', fontFamily: "'Be Vietnam Pro', system-ui, sans-serif", fontWeight: 800, fontStyle: 'normal', letterSpacing: '-1px' }}>
                thành một{' '}
              </span>
              <span style={{ color: '#000000', fontFamily: "'Be Vietnam Pro', system-ui, sans-serif", fontWeight: 800, fontStyle: 'normal', letterSpacing: '-1px' }}>
                điểm sáng trên bản đồ.
              </span>
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={rise}
            className="mt-8 max-w-2xl text-base sm:text-lg leading-relaxed km-cinematic-copy animate-fade-rise-delay"
            style={{ color: '#6F6F6F' }}
          >
            Xây dựng nền tảng cho những tâm hồn nhân ái và những người muốn trao đi những hành động đẹp.
            Qua nhiều cuộc thảo luận, chúng tôi tạo nên những không gian số để lan tỏa lòng tốt
            theo cách hiện đại, trực quan và truyền cảm hứng.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={rise}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-rise-delay-2"
          >
            <motion.button
              whileHover={noMotion ? undefined : { scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { if (!isAuthenticated) setActiveModal('login'); else navigate('/submit'); }}
              className="km-hero-cta km-btn-shine px-14 py-5 text-base"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Ghim Việc Tốt Của Bạn
            </motion.button>

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

          {/* ── Enhanced Live stats strip with icons & accent colors ── */}
          <motion.div
            variants={rise}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl animate-fade-rise-delay-3"
          >
            {statDefinitions.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.key}
                  className="km-stat-accent px-4 py-4 text-center"
                  style={{
                    '--stat-accent': s.accent,
                    background: `linear-gradient(145deg, ${s.bgFrom}, ${s.bgTo}), rgba(255,255,255,0.85)`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center"
                    style={{ background: s.bgFrom }}
                  >
                    <Icon className="w-4 h-4" style={{ color: s.accent }} />
                  </div>
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
              );
            })}
          </motion.div>
        </motion.div>

        {/* Fade to page background */}
        <div
          className="absolute inset-x-0 bottom-0 z-[2]"
          style={{ height: 80, background: 'linear-gradient(to top, var(--color-background, #f8fafc), transparent)' }}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS – 3-STEP VISUAL SECTION
         ═══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16"
        variants={sectionReveal}
        initial={noMotion ? false : 'hidden'}
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
      >
        <div className="flex flex-col items-center text-center gap-3 mb-12">
          <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            Cách Thức Hoạt Động
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Ba Bước Thật Đơn Giản
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
            Từ một hành động nhỏ đến một điểm sáng trên bản đồ cộng đồng toàn quốc.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
          {/* Connector line desktop */}
          <div
            className="hidden sm:block absolute pointer-events-none"
            style={{ top: 52, left: 'calc(33.33% + 16px)', right: 'calc(33.33% + 16px)', height: 2, background: 'linear-gradient(90deg, #10b981, #06b6d4)', opacity: 0.35 }}
          />

          {howItWorksSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.n}
                initial={noMotion ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.55, delay: idx * 0.14, ease }}
                className="relative flex flex-col items-center text-center gap-4 p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden"
              >
                {/* Step icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg km-glow-pulse relative z-20"
                  style={{ background: step.color, boxShadow: `0 12px 32px -8px ${step.color}55` }}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span
                  className="absolute top-4 right-5 text-[11px] font-black tracking-widest"
                  style={{ color: step.color, opacity: 0.4 }}
                >
                  {step.n}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{step.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                {/* Bottom accent */}
                <div
                  className="absolute bottom-0 left-8 right-8 h-0.5 rounded-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${step.color}70, transparent)` }}
                />
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-center mt-10">
          <motion.button
            whileHover={noMotion ? undefined : { scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { if (!isAuthenticated) setActiveModal('login'); else navigate('/submit'); }}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-white shadow-lg transition-all km-btn-shine"
            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
          >
            <PlusCircle className="w-4 h-4" />
            Bắt Đầu Ngay Hôm Nay
          </motion.button>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════
          INTERACTIVE MAP SECTION
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-8 py-4 pb-16">
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
                enableWheelZoom={false}
              />
            </Suspense>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED STORIES
         ═══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-8 pb-16"
        variants={sectionReveal}
        initial={noMotion ? false : 'hidden'}
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
      >
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
          {loading ? (
            [0, 1, 2].map((i) => <StorySkeleton key={i} />)
          ) : stories.length === 0 ? (
            <>
              {[0, 1, 2].map((i) => <StorySkeleton key={i} />)}
              <div className="col-span-full mt-4 flex flex-col items-center gap-4 py-8">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                >
                  <HeartHandshake className="w-8 h-8 text-white" />
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-semibold text-base">
                  Hãy là người đầu tiên chia sẻ câu chuyện của bạn!
                </p>
                <button
                  onClick={() => { if (!isAuthenticated) setActiveModal('login'); else navigate('/submit'); }}
                  className="px-7 py-3 rounded-2xl text-sm font-bold text-white km-btn-shine"
                  style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                >
                  Đăng Câu Chuyện Ngay
                </button>
              </div>
            </>
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
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════
          GAMIFICATION / JOURNEY SECTION
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-20">
        <div
          className="relative overflow-hidden rounded-[32px] py-16 px-6 sm:px-10 lg:px-14 shadow-2xl border border-emerald-900/30"
          style={{ background: 'linear-gradient(135deg, #0a2a1a 0%, #0f3d28 50%, #0d2b35 100%)' }}
        >
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

            {/* Points breakdown cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 w-full text-left">
              {[
                { icon: CheckCircle, label: 'Ghim Việc Tốt',     pts: '+10–50 pts / bài',   color: '#34d399' },
                { icon: Heart,       label: 'Nhận Lượt Thích',   pts: '+2 pts / lượt',       color: '#fb7185' },
                { icon: Trophy,      label: 'Giải Thưởng Tháng', pts: 'Huy hiệu đặc biệt',  color: '#fbbf24' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 backdrop-blur-md p-5 flex items-start gap-4"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${item.color}22` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{item.label}</p>
                      <p className="font-black text-xs mt-0.5" style={{ color: item.color }}>{item.pts}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate('/leaderboard')}
              className="mt-8 px-8 py-3.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-emerald-50 transition-colors flex items-center gap-2 km-btn-shine"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Xem Danh Sách Top Dẫn Đầu</span>
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          COMMUNITY CTA BANNER (new section)
         ═══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-24"
        variants={sectionReveal}
        initial={noMotion ? false : 'hidden'}
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
      >
        <div className="km-community-banner py-16 sm:py-20 px-8 sm:px-16 relative">
          {/* Floating particles */}
          {!noMotion && PARTICLES.map((p, i) => (
            <div
              key={i}
              className="km-particle"
              style={{
                width: p.size,
                height: p.size,
                left: p.left,
                bottom: p.bottom,
                animationDelay: p.delay,
                animationDuration: p.duration,
                background: p.color,
              }}
            />
          ))}

          <div className="relative z-10 flex flex-col items-center text-center gap-6">
            {/* Live badge */}
            <div className="km-live-badge">
              <div className="km-live-dot" />
              <span className="text-emerald-300 font-bold text-[11px] tracking-wide">
                {stats.activeCitizens > 0
                  ? `${stats.activeCitizens} người đang hoạt động`
                  : 'Cộng đồng đang mở rộng'}
              </span>
            </div>

            <h2
              className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl leading-tight"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
            >
              Tham Gia Cùng Chúng Tôi{' '}
              <span className="text-emerald-300">Lan Tỏa Lòng Tốt</span>{' '}
              Khắp Việt Nam
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Mỗi bài đăng là một điểm sáng. Mỗi tương tác là một nụ cười. Cùng nhau, chúng ta
              xây dựng bản đồ nhân ái lớn nhất Việt Nam.
            </p>

            {/* Live stats row */}
            <div className="flex flex-wrap items-center justify-center gap-6 my-2">
              {[
                { v: stats.pinnedGoodDeeds, l: 'Việc Tốt',   icon: '✅' },
                { v: stats.activeCitizens,  l: 'Thành Viên', icon: '👥' },
                { v: stats.coveredCities,   l: 'Tỉnh Thành', icon: '🗺️' },
              ].map((s) => (
                <div key={s.l} className="flex items-center gap-2 text-white">
                  <span className="text-lg">{s.icon}</span>
                  <span className="font-black text-xl text-emerald-300">
                    <AnimatedNumber value={s.v} disabled={noMotion} />
                  </span>
                  <span className="text-xs text-slate-300 font-medium">{s.l}</span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <motion.button
                whileHover={noMotion ? undefined : { scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { if (!isAuthenticated) setActiveModal('register'); else navigate('/submit'); }}
                className="px-10 py-4 rounded-2xl font-bold text-slate-950 text-sm shadow-xl km-btn-shine transition-all"
                style={{ background: 'linear-gradient(135deg, #34d399, #06b6d4)' }}
              >
                🚀 Đăng Ký Miễn Phí
              </motion.button>
              <motion.button
                whileHover={noMotion ? undefined : { scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/explore')}
                className="px-10 py-4 rounded-2xl font-bold text-white text-sm border border-white/25 backdrop-blur-sm hover:bg-white/10 transition-all"
              >
                🗺️ Xem Bản Đồ
              </motion.button>
            </div>
          </div>
        </div>
      </motion.section>

    </div>
  );
};

export default HomeAnimated;