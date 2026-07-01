import { useEffect } from 'react';

const isEditableElement = (element) => {
  if (!element) return false;
  return Boolean(
    element.closest('input, textarea, select, [contenteditable="true"], .custom-scrollbar, [data-native-scroll]')
  );
};

const hasScrollableParent = (element) => {
  let current = element;
  while (current && current !== document.body && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const canScrollY = /(auto|scroll)/.test(style.overflowY) && current.scrollHeight > current.clientHeight + 1;
    if (canScrollY) return true;
    current = current.parentElement;
  }
  return false;
};

export const SmoothScrollTuner = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let rafId = 0;

    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

    const stop = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const tick = () => {
      const distance = targetY - currentY;
      currentY += distance * 0.18;

      if (Math.abs(distance) < 0.6) {
        currentY = targetY;
        window.scrollTo(0, currentY);
        rafId = 0;
        return;
      }

      window.scrollTo(0, currentY);
      rafId = window.requestAnimationFrame(tick);
    };

    const onWheel = (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isEditableElement(event.target) || hasScrollableParent(event.target)) return;

      event.preventDefault();
      currentY = window.scrollY;
      targetY = Math.max(0, Math.min(maxScroll(), targetY + event.deltaY));

      if (!rafId) rafId = window.requestAnimationFrame(tick);
    };

    const syncScroll = () => {
      if (!rafId) {
        targetY = window.scrollY;
        currentY = window.scrollY;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', syncScroll, { passive: true });
    window.addEventListener('resize', syncScroll, { passive: true });

    return () => {
      stop();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', syncScroll);
      window.removeEventListener('resize', syncScroll);
    };
  }, []);

  return null;
};

export default SmoothScrollTuner;
