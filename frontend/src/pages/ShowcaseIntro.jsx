import React, { useMemo, useRef, useState } from 'react';
import { ArrowRight, Bot, HeartHandshake, MapPinned, Play, RefreshCw, Share2, Sparkles, Trophy, Users } from 'lucide-react';
import { useShowcaseIntroGsap } from '../hooks/useShowcaseIntroGsap';

const words = ['Biến', 'mỗi', 'việc', 'tốt', 'thành', 'một', 'điểm', 'sáng.'];

const features = [
  { icon: MapPinned, title: 'Bản đồ sống', text: 'Ghim việc tốt theo vị trí thật', color: 'from-emerald-300 to-teal-300' },
  { icon: HeartHandshake, title: 'Câu chuyện tử tế', text: 'Lan tỏa cảm hứng cộng đồng', color: 'from-rose-300 to-orange-300' },
  { icon: Bot, title: 'AI Ghép Nối', text: 'Kết nối người cần và người giúp', color: 'from-cyan-300 to-blue-300' },
  { icon: Trophy, title: 'Bảng xếp hạng', text: 'Ghi nhận công dân tích cực', color: 'from-amber-300 to-yellow-300' },
];

const counters = [
  { value: '303+', label: 'việc tốt' },
  { value: '63', label: 'tỉnh thành' },
  { value: 'AI', label: 'kết nối' },
];

export const ShowcaseIntro = () => {
  const scopeRef = useRef(null);
  const [replayKey, setReplayKey] = useState(0);
  useShowcaseIntroGsap(scopeRef, replayKey);

  const dots = useMemo(() => [
    { x: 39, y: 24, label: 'Hà Nội' },
    { x: 48, y: 43, label: 'Huế' },
    { x: 54, y: 54, label: 'Đà Nẵng' },
    { x: 61, y: 76, label: 'TP.HCM' },
    { x: 45, y: 84, label: 'Cần Thơ' },
  ], []);

  return (
    <main ref={scopeRef} className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.28),transparent_28%),radial-gradient(circle_at_80%_8%,rgba(59,130,246,0.20),transparent_30%),radial-gradient(circle_at_72%_86%,rgba(168,85,247,0.18),transparent_34%)]" />
      <div className="absolute inset-0 km-grid-bg opacity-[0.08]" />
      <div className="ks-aurora absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-400/24 blur-3xl" />
      <div className="ks-aurora absolute right-0 top-1/4 h-96 w-96 rounded-full bg-cyan-400/18 blur-3xl" />
      <div className="ks-aurora absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-violet-500/16 blur-3xl" />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1480px] grid-cols-1 items-center gap-10 px-5 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-12">
        <section className="flex flex-col items-start">
          <div className="ks-logo ks-hidden mb-7 flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-[1.35rem] bg-gradient-to-br from-emerald-300 via-teal-300 to-cyan-300 text-slate-950 shadow-[0_22px_70px_-20px_rgba(45,212,191,0.9)]">
              <HeartHandshake className="h-8 w-8" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-[-0.04em] text-emerald-100">KindnessMap</div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300/70">Bản đồ việc tốt</div>
            </div>
          </div>

          <div className="ks-kicker ks-hidden mb-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-black text-emerald-100 backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            Một hành động nhỏ có thể sáng cả cộng đồng
          </div>

          <h1 className="max-w-4xl text-[clamp(3.5rem,8vw,8.5rem)] font-black leading-[0.9] tracking-[-0.07em]">
            {words.map((word, index) => (
              <span key={`${word}-${index}`} className="mr-[0.16em] inline-block overflow-hidden pb-2 align-bottom">
                <span className={`ks-word ks-hidden inline-block ${index >= 5 ? 'text-emerald-100' : 'text-white'}`}>{word}</span>
              </span>
            ))}
          </h1>

          <p className="ks-subcopy ks-hidden mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-300 sm:text-xl">
            Ghim việc tốt lên bản đồ, kể câu chuyện tử tế, kết nối cộng đồng bằng AI và biến lòng tốt thành dữ liệu truyền cảm hứng.
          </p>

          <div className="ks-final ks-hidden mt-8 flex flex-wrap items-center gap-4">
            <button className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 px-6 py-4 text-sm font-black text-slate-950 shadow-[0_18px_60px_-20px_rgba(45,212,191,0.95)]">
              <Play className="h-5 w-5 fill-slate-950" />
              Ghim Việc Tốt Ngay
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={() => setReplayKey((key) => key + 1)} className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-5 py-4 text-sm font-black text-white backdrop-blur-xl hover:bg-white/12">
              <RefreshCw className="h-4 w-4" /> Replay
            </button>
          </div>
        </section>

        <section className="relative min-h-[620px] lg:min-h-[760px]">
          <div className="ks-map-shell ks-hidden absolute left-1/2 top-1/2 w-full max-w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-[2.4rem] border border-white/15 bg-white/[0.07] p-4 shadow-[0_40px_120px_-45px_rgba(45,212,191,0.75)] backdrop-blur-2xl">
            <div className="relative h-[430px] overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#07111f]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(16,185,129,0.22),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.35),rgba(2,6,23,0.92))]" />
              <svg viewBox="0 0 620 430" className="absolute inset-0 h-full w-full opacity-90">
                <path d="M245 54 C315 88 315 132 292 171 C268 212 315 230 354 252 C414 287 430 350 378 384 C327 418 250 377 240 318 C231 259 187 242 164 198 C136 144 171 77 245 54Z" fill="rgba(20,184,166,0.08)" stroke="rgba(125,211,252,0.24)" strokeWidth="2" />
                <path className="ks-path" d="M242 106 C286 146 284 182 304 212 C326 244 374 282 384 336 C338 372 292 334 284 284 C276 236 228 216 214 176 C202 142 210 118 242 106Z" fill="none" stroke="url(#route)" strokeWidth="4" strokeLinecap="round" />
                <defs>
                  <linearGradient id="route" x1="0" x2="1">
                    <stop stopColor="#6ee7b7" />
                    <stop offset="1" stopColor="#67e8f9" />
                  </linearGradient>
                </defs>
              </svg>

              {dots.map((dot, index) => (
                <div key={dot.label} className="ks-dot ks-hidden absolute" style={{ left: `${dot.x}%`, top: `${dot.y}%` }}>
                  <span className="ks-pulse absolute -left-3 -top-3 h-6 w-6 rounded-full bg-emerald-300/45" />
                  <span className="relative block h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-300 shadow-[0_0_25px_rgba(110,231,183,0.9)]" />
                  <span className="absolute left-5 top-[-8px] whitespace-nowrap rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-[10px] font-black text-emerald-100 backdrop-blur-xl">{dot.label}</span>
                </div>
              ))}

              <div className="absolute left-5 top-5 rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-3 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-200"><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" /> LIVE KINDNESS MAP</div>
                <div className="mt-1 text-[11px] text-slate-300">303 điểm tốt đang lan tỏa</div>
              </div>

              <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-3">
                {counters.map((item) => (
                  <div key={item.label} className="ks-counter ks-hidden rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-xl">
                    <div className="text-2xl font-black text-white">{item.value}</div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-300">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className={`ks-feature-card ks-hidden pointer-events-auto rounded-[1.6rem] border border-white/12 bg-slate-950/74 p-4 shadow-2xl backdrop-blur-2xl ${index % 2 ? 'sm:translate-y-10' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${feature.color} text-slate-950`}><Icon className="h-5 w-5" /></div>
                    <div>
                      <div className="font-black text-white">{feature.title}</div>
                      <div className="text-xs font-semibold text-slate-400">{feature.text}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="ks-final ks-hidden absolute bottom-5 right-5 z-20 hidden items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-black text-slate-300 backdrop-blur-xl sm:flex">
        <Share2 className="h-4 w-4 text-emerald-300" /> Trang này phù hợp quay TikTok/Reels 9–12s
      </div>
    </main>
  );
};

export default ShowcaseIntro;
