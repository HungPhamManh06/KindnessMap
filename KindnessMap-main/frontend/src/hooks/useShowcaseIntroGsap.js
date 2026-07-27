import { useEffect } from 'react';

export const useShowcaseIntroGsap = (scopeRef, replayKey = 0) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !scopeRef?.current) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ctx;
    let mounted = true;

    import('gsap').then((module) => {
      if (!mounted || !scopeRef.current) return;
      const gsap = module.gsap || module.default || module;

      ctx = gsap.context(() => {
        if (reduceMotion) {
          gsap.set('.ks-hidden', { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, rotateY: 0, filter: 'blur(0px)' });
          return;
        }

        gsap.set('.ks-hidden', { autoAlpha: 0 });
        gsap.set('.ks-logo', { scale: 0.72, rotate: -8, filter: 'blur(14px)' });
        gsap.set('.ks-word', { yPercent: 110, rotateX: -50, filter: 'blur(16px)' });
        gsap.set('.ks-map-shell', { x: 80, y: 28, scale: 0.88, rotateY: -14, filter: 'blur(16px)' });
        gsap.set('.ks-feature-card', { y: 44, scale: 0.9, rotateX: 18, filter: 'blur(12px)' });
        gsap.set('.ks-dot', { scale: 0 });
        gsap.set('.ks-path', { strokeDasharray: 900, strokeDashoffset: 900 });
        gsap.set('.ks-counter', { y: 24, filter: 'blur(10px)' });
        gsap.set('.ks-final', { y: 34, scale: 0.94, filter: 'blur(12px)' });

        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

        tl.to('.ks-logo', { autoAlpha: 1, scale: 1, rotate: 0, filter: 'blur(0px)', duration: 0.9 })
          .to('.ks-kicker', { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.65 }, '-=0.45')
          .to('.ks-word', { autoAlpha: 1, yPercent: 0, rotateX: 0, filter: 'blur(0px)', duration: 0.95, stagger: 0.055 }, '-=0.2')
          .to('.ks-subcopy', { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.65 }, '-=0.45')
          .to('.ks-map-shell', { autoAlpha: 1, x: 0, y: 0, scale: 1, rotateY: 0, filter: 'blur(0px)', duration: 1.05 }, '-=0.55')
          .to('.ks-path', { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, '-=0.65')
          .to('.ks-dot', { autoAlpha: 1, scale: 1, duration: 0.48, stagger: 0.13, ease: 'back.out(2.4)' }, '-=0.65')
          .to('.ks-feature-card', { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.09 }, '-=0.45')
          .to('.ks-counter', { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.65, stagger: 0.08 }, '-=0.35')
          .to('.ks-final', { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.75 }, '-=0.2');

        gsap.to('.ks-aurora', {
          x: 'random(-42, 42)',
          y: 'random(-36, 36)',
          scale: 'random(0.92, 1.1)',
          duration: 'random(5, 8)',
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          stagger: 0.3,
        });

        gsap.to('.ks-map-shell', {
          y: -14,
          duration: 3.2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: 3.2,
        });

        gsap.to('.ks-pulse', {
          scale: 1.9,
          autoAlpha: 0,
          duration: 1.5,
          ease: 'power2.out',
          repeat: -1,
          stagger: 0.18,
          delay: 3.6,
        });
      }, scopeRef);
    });

    return () => {
      mounted = false;
      if (ctx) ctx.revert();
    };
  }, [scopeRef, replayKey]);
};

export default useShowcaseIntroGsap;
