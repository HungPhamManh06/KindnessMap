import { useEffect } from 'react';

const isBrowser = typeof window !== 'undefined';

export const useGsapHomeAnimations = ({ scopeRef, disabled = false } = {}) => {
  useEffect(() => {
    if (!isBrowser || disabled || !scopeRef?.current) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmallScreen = window.matchMedia('(max-width: 767px)').matches;
    if (reduceMotion || isSmallScreen) return undefined;

    let ctx;
    let cleanupMagnetic = () => {};
    let mounted = true;

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([gsapModule, scrollTriggerModule]) => {
      if (!mounted || !scopeRef.current) return;

      const gsap = gsapModule.gsap || gsapModule.default || gsapModule;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const heroTimeline = gsap.timeline({ defaults: { ease: 'power4.out' } });

        heroTimeline
          .fromTo(
            '.km-gsap-eyebrow',
            { autoAlpha: 0, y: 18, filter: 'blur(10px)' },
            { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.7 },
          )
          .fromTo(
            '.km-gsap-title-word',
            { autoAlpha: 0, yPercent: 70, rotateX: -45, filter: 'blur(14px)' },
            { autoAlpha: 1, yPercent: 0, rotateX: 0, filter: 'blur(0px)', duration: 0.95, stagger: 0.045 },
            '-=0.35',
          )
          .fromTo(
            '.km-gsap-copy, .km-gsap-cta, .km-gsap-pill',
            { autoAlpha: 0, y: 20, filter: 'blur(8px)' },
            { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.72, stagger: 0.055 },
            '-=0.45',
          )
          .fromTo(
            '.km-gsap-map-card',
            { autoAlpha: 0, x: 42, scale: 0.94, rotateY: -8, filter: 'blur(14px)' },
            { autoAlpha: 1, x: 0, scale: 1, rotateY: 0, filter: 'blur(0px)', duration: 1.05 },
            '-=0.75',
          );

        gsap.to('.km-gsap-orb', {
          x: 'random(-28, 28)',
          y: 'random(-22, 22)',
          scale: 'random(0.95, 1.08)',
          duration: 'random(4.5, 7)',
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          stagger: 0.28,
        });

        gsap.to('.km-gsap-map-card', {
          y: -18,
          duration: 3.8,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });

        gsap.utils.toArray('.km-gsap-reveal').forEach((element) => {
          gsap.fromTo(
            element,
            { autoAlpha: 0, y: 40, scale: 0.99 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.68,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: element,
                start: 'top 82%',
                once: true,
              },
            },
          );
        });

        ScrollTrigger.batch('.km-gsap-card', {
          start: 'top 86%',
          once: true,
          onEnter: (batch) =>
            gsap.fromTo(
              batch,
              // Chỉ animate transform/opacity để compositor xử lý mượt, không dùng filter blur.
              { autoAlpha: 0, y: 30, scale: 0.98 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.58, ease: 'power3.out', stagger: 0.06 },
            ),
        });

        const magneticItems = gsap.utils.toArray('.km-gsap-magnetic');
        const listeners = magneticItems.map((item) => {
          const onMove = (event) => {
            const rect = item.getBoundingClientRect();
            const x = event.clientX - rect.left - rect.width / 2;
            const y = event.clientY - rect.top - rect.height / 2;
            gsap.to(item, {
              x: x * 0.14,
              y: y * 0.14,
              rotateX: -y * 0.025,
              rotateY: x * 0.025,
              duration: 0.45,
              ease: 'power3.out',
            });
          };

          const onLeave = () => {
            gsap.to(item, {
              x: 0,
              y: 0,
              rotateX: 0,
              rotateY: 0,
              duration: 0.65,
              ease: 'elastic.out(1, 0.45)',
            });
          };

          item.addEventListener('mousemove', onMove);
          item.addEventListener('mouseleave', onLeave);
          return () => {
            item.removeEventListener('mousemove', onMove);
            item.removeEventListener('mouseleave', onLeave);
          };
        });

        cleanupMagnetic = () => listeners.forEach((cleanup) => cleanup());
      }, scopeRef);
    });

    return () => {
      mounted = false;
      cleanupMagnetic();
      if (ctx) ctx.revert();
    };
  }, [scopeRef, disabled]);
};

export default useGsapHomeAnimations;
