import React, { useEffect, useRef, useState } from 'react';

export const CINEMATIC_HERO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4';

/**
 * CinematicVideoBackground
 * — Loops a video with smooth fade-in / fade-out via requestAnimationFrame.
 * — Gradient overlays fade to white (for the light/cinematic KindnessMap hero).
 */
export const CinematicVideoBackground = ({
  src = CINEMATIC_HERO_VIDEO_URL,
  className = '',
  videoClassName = '',
  style,
}) => {
  const videoRef = useRef(null);
  const frameRef = useRef(null);
  const restartTimerRef = useRef(null);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    let mounted = true;
    const fadeDuration = 0.5; // seconds

    const safePlay = () => {
      const playPromise = video.play();
      if (playPromise?.catch) playPromise.catch(() => {});
    };

    const tick = () => {
      if (!mounted || !video) return;

      const { currentTime, duration } = video;
      let nextOpacity = 1;

      if (!Number.isFinite(duration) || duration <= 0) {
        nextOpacity = 0;
      } else if (currentTime < fadeDuration) {
        // fade in: 0 → 1
        nextOpacity = Math.max(0, Math.min(1, currentTime / fadeDuration));
      } else if (duration - currentTime < fadeDuration) {
        // fade out: 1 → 0
        nextOpacity = Math.max(0, Math.min(1, (duration - currentTime) / fadeDuration));
      }

      setOpacity(nextOpacity);
      frameRef.current = window.requestAnimationFrame(tick);
    };

    const handleEnded = () => {
      setOpacity(0);
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = window.setTimeout(() => {
        if (!mounted || !video) return;
        video.currentTime = 0;
        safePlay();
      }, 100);
    };

    video.addEventListener('ended', handleEnded);
    video.currentTime = 0;
    safePlay();
    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      mounted = false;
      video.removeEventListener('ended', handleEnded);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      window.clearTimeout(restartTimerRef.current);
    };
  }, [src]);

  return (
    <div
      className={`pointer-events-none absolute overflow-hidden ${className}`}
      style={style}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        className={`h-full w-full object-cover ${videoClassName}`}
        src={src}
        muted
        playsInline
        preload="metadata"
        style={{ opacity, transition: 'opacity 0.05s linear' }}
      />
      {/* Top gradient — fades from white into transparent (blends with hero bg) */}
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: '220px', background: 'linear-gradient(to bottom, #ffffff, transparent)' }}
      />
      {/* Bottom gradient — fades to white for seamless page flow */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: '200px', background: 'linear-gradient(to top, #ffffff, transparent)' }}
      />
      {/* Left + Right side vignettes — subtle white edges */}
      <div
        className="absolute inset-y-0 left-0"
        style={{ width: '120px', background: 'linear-gradient(to right, rgba(255,255,255,0.6), transparent)' }}
      />
      <div
        className="absolute inset-y-0 right-0"
        style={{ width: '120px', background: 'linear-gradient(to left, rgba(255,255,255,0.6), transparent)' }}
      />
    </div>
  );
};

export default CinematicVideoBackground;