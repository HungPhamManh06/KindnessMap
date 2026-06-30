import React from 'react';

/* ────────────────────────────────────────────────────────
   Cloud shape — pure CSS, no images needed
   ──────────────────────────────────────────────────────── */
const Cloud = ({ style, scale = 1, opacity = 0.88 }) => (
  <div
    style={{
      position: 'absolute',
      opacity,
      transform: `scale(${scale})`,
      ...style,
    }}
    aria-hidden="true"
  >
    <div
      style={{
        position: 'relative',
        width: 180,
        height: 60,
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 50,
        filter: 'blur(1px)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -35,
          left: 25,
          width: 90,
          height: 80,
          background: 'rgba(255,255,255,0.90)',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -22,
          left: 80,
          width: 65,
          height: 65,
          background: 'rgba(255,255,255,0.90)',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -14,
          left: 115,
          width: 50,
          height: 50,
          background: 'rgba(255,255,255,0.88)',
          borderRadius: '50%',
        }}
      />
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────
   Tree shape — layered ellipses
   ──────────────────────────────────────────────────────── */
const Tree = ({ style, h = 120, w = 60, color = '#2e7d32', color2 = '#388e3c' }) => (
  <div style={{ position: 'absolute', ...style }} aria-hidden="true">
    {/* trunk */}
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: w * 0.18,
        height: h * 0.35,
        background: '#6d4c41',
        borderRadius: 4,
      }}
    />
    {/* foliage layers */}
    <div
      style={{
        position: 'absolute',
        bottom: h * 0.28,
        left: '50%',
        transform: 'translateX(-50%)',
        width: w,
        height: h * 0.65,
        background: color,
        borderRadius: '50% 50% 40% 40%',
      }}
    />
    <div
      style={{
        position: 'absolute',
        bottom: h * 0.45,
        left: '50%',
        transform: 'translateX(-50%)',
        width: w * 0.78,
        height: h * 0.5,
        background: color2,
        borderRadius: '50% 50% 40% 40%',
      }}
    />
  </div>
);

/* ────────────────────────────────────────────────────────
   Main animated nature background component
   ──────────────────────────────────────────────────────── */
export const AnimatedNatureBackground = () => (
  <div
    className="absolute inset-0 overflow-hidden select-none"
    aria-hidden="true"
    style={{ zIndex: 0 }}
  >
    {/* ── SKY gradient ─────────────────────────────────── */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(180deg, #4fc3f7 0%, #81d4fa 18%, #b3e5fc 38%, #e0f7fa 60%, #c8e6c9 80%, #a5d6a7 100%)',
      }}
    />

    {/* ── SUN ──────────────────────────────────────────── */}
    <div
      className="absolute rounded-full km-sun-pulse"
      style={{
        top: '7%',
        right: '18%',
        width: 72,
        height: 72,
        background:
          'radial-gradient(circle, #fff9c4 0%, #fff176 35%, rgba(255,238,88,0.4) 65%, transparent 100%)',
        boxShadow: '0 0 60px 30px rgba(255,249,196,0.55)',
      }}
    />

    {/* ── CLOUDS (animated, looping) ───────────────────── */}
    {/* Cloud 1 — slow, large */}
    <Cloud
      style={{ top: '8%', left: 0, animation: 'km-cloud-1 55s linear infinite' }}
      scale={1.3}
      opacity={0.82}
    />
    {/* Cloud 2 — medium speed */}
    <Cloud
      style={{ top: '16%', left: 0, animation: 'km-cloud-2 38s linear infinite', animationDelay: '-18s' }}
      scale={0.85}
      opacity={0.7}
    />
    {/* Cloud 3 — fast, small */}
    <Cloud
      style={{ top: '6%', left: 0, animation: 'km-cloud-3 28s linear infinite', animationDelay: '-10s' }}
      scale={0.6}
      opacity={0.6}
    />
    {/* Cloud 4 — extra slow, far bg */}
    <Cloud
      style={{ top: '22%', left: 0, animation: 'km-cloud-1 70s linear infinite', animationDelay: '-35s' }}
      scale={0.55}
      opacity={0.45}
    />

    {/* ── MOUNTAIN LAYERS (SVG) ────────────────────────── */}
    <svg
      className="absolute bottom-0 left-0 w-full"
      style={{ height: '62%' }}
      viewBox="0 0 1440 420"
      preserveAspectRatio="xMidYMax slice"
    >
      {/* Far mountains — blue-grey */}
      <path
        d="M-60,420 L0,220 L80,260 L180,150 L320,110 L460,190 L580,90 L720,170 L860,75 L1000,155 L1160,65 L1300,145 L1380,105 L1500,180 L1500,420 Z"
        fill="#90a4ae"
        opacity="0.45"
      />
      {/* Mid mountains — green-grey */}
      <path
        d="M-60,420 L0,285 L140,210 L280,260 L430,175 L580,240 L730,155 L880,235 L1050,145 L1240,225 L1380,170 L1500,200 L1500,420 Z"
        fill="#66bb6a"
        opacity="0.55"
      />
      {/* Near hills — rich green */}
      <path
        d="M-60,420 L0,340 L180,285 L380,320 L560,265 L760,310 L960,258 L1150,300 L1380,270 L1500,295 L1500,420 Z"
        fill="#4caf50"
        opacity="0.75"
      />
      {/* Foreground hills — bright emerald */}
      <ellipse cx="160" cy="400" rx="280" ry="95" fill="#43a047" />
      <ellipse cx="620" cy="415" rx="320" ry="100" fill="#388e3c" />
      <ellipse cx="1080" cy="408" rx="300" ry="98" fill="#43a047" />
      <ellipse cx="1400" cy="420" rx="250" ry="90" fill="#388e3c" />
      {/* Ground base */}
      <rect x="-60" y="395" width="1560" height="25" fill="#33691e" />
    </svg>

    {/* ── TREES — left cluster ─────────────────────────── */}
    <Tree style={{ bottom: '20%', left: '2%', width: 70, height: 130 }} h={130} w={70} color="#1b5e20" color2="#2e7d32" />
    <Tree style={{ bottom: '19%', left: '5.5%', width: 55, height: 105 }} h={105} w={55} color="#2e7d32" color2="#388e3c" />
    <Tree style={{ bottom: '17%', left: '8%', width: 80, height: 150 }} h={150} w={80} color="#1b5e20" color2="#256427" />

    {/* ── TREES — right cluster ────────────────────────── */}
    <Tree style={{ bottom: '20%', right: '3%', width: 75, height: 140 }} h={140} w={75} color="#1b5e20" color2="#2e7d32" />
    <Tree style={{ bottom: '18%', right: '6.5%', width: 55, height: 105 }} h={105} w={55} color="#2e7d32" color2="#388e3c" />
    <Tree style={{ bottom: '20%', right: '10%', width: 65, height: 125 }} h={125} w={65} color="#1b5e20" color2="#256427" />

    {/* ── TREES — mid background ───────────────────────── */}
    <Tree style={{ bottom: '28%', left: '25%', width: 38, height: 75 }} h={75} w={38} color="#2e7d32" color2="#43a047" />
    <Tree style={{ bottom: '29%', right: '28%', width: 35, height: 70 }} h={70} w={35} color="#2e7d32" color2="#43a047" />
    <Tree style={{ bottom: '27%', left: '42%', width: 32, height: 65 }} h={65} w={32} color="#388e3c" color2="#4caf50" />

    {/* ── RIVER / STREAM ───────────────────────────────── */}
    <div
      className="absolute km-river-shimmer"
      style={{
        bottom: '19%',
        left: '32%',
        width: '12%',
        height: '5%',
        background:
          'linear-gradient(90deg, transparent, rgba(129,212,250,0.65), rgba(100,200,255,0.8), rgba(129,212,250,0.55), transparent)',
        borderRadius: '50%',
        transform: 'rotate(-3deg) scaleX(1.5)',
      }}
    />
    {/* River highlight */}
    <div
      className="absolute km-river-shimmer"
      style={{
        bottom: '20.5%',
        left: '34%',
        width: '7%',
        height: '2%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
        borderRadius: '50%',
        animationDelay: '-1.5s',
      }}
    />

    {/* ── FLOWERS / DETAILS — scattered ───────────────── */}
    {[
      { left: '14%', bottom: '20%', color: '#f48fb1' },
      { left: '20%', bottom: '19%', color: '#fff176' },
      { left: '72%', bottom: '20%', color: '#f48fb1' },
      { left: '80%', bottom: '19%', color: '#fff176' },
      { left: '50%', bottom: '18%', color: '#ffccbc' },
    ].map((f, i) => (
      <div
        key={i}
        className="absolute rounded-full"
        style={{
          left: f.left,
          bottom: f.bottom,
          width: 8,
          height: 8,
          background: f.color,
          boxShadow: `0 0 6px 2px ${f.color}88`,
          animation: `km-flower-bob ${2 + i * 0.3}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
        }}
      />
    ))}

    {/* ── BIRDS (tiny animated dots) ───────────────────── */}
    <div className="absolute km-bird-1" style={{ top: '18%', left: '30%', width: 6, height: 3, background: '#37474f', borderRadius: '50%' }} />
    <div className="absolute km-bird-1" style={{ top: '20%', left: '33%', width: 5, height: 2.5, background: '#37474f', borderRadius: '50%', animationDelay: '-2s' }} />
    <div className="absolute km-bird-1" style={{ top: '15%', left: '62%', width: 6, height: 3, background: '#455a64', borderRadius: '50%', animationDelay: '-5s' }} />

    {/* ── GRADIENT OVERLAY — top readability ───────────── */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.18) 0%, transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 40%, transparent 70%, rgba(0,0,0,0.05) 100%)',
        pointerEvents: 'none',
      }}
    />
  </div>
);

export default AnimatedNatureBackground;
