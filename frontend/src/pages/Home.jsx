import React, { lazy, Suspense } from 'react';

const HomeAnimated = lazy(() => import('./HomeAnimated').then((module) => ({ default: module.HomeAnimated })));

const HomeFallback = () => (
  <div className="relative flex flex-col gap-8 pb-16 overflow-x-hidden km-modern-home">
    <section className="relative px-4 sm:px-6 lg:px-8 max-w-[1500px] mx-auto w-full pt-8 lg:pt-12">
      <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] border border-white/10 bg-slate-950 text-white shadow-[0_35px_120px_-55px_rgba(16,185,129,0.8)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.32),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(20,184,166,0.24),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(2,6,23,0.98))]" />
        <div className="relative z-10 px-5 sm:px-9 lg:px-14 py-12 sm:py-16 lg:py-20">
          <div className="animate-pulse max-w-3xl">
            <div className="h-9 w-64 rounded-full bg-white/10" />
            <div className="mt-8 h-14 sm:h-20 w-full rounded-3xl bg-white/10" />
            <div className="mt-4 h-14 sm:h-20 w-4/5 rounded-3xl bg-white/10" />
            <div className="mt-8 h-5 w-full rounded-full bg-white/10" />
            <div className="mt-3 h-5 w-2/3 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </section>
  </div>
);

export const Home = () => (
  <Suspense fallback={<HomeFallback />}>
    <HomeAnimated />
  </Suspense>
);

export default Home;
