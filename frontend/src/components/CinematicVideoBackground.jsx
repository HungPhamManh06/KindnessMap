import React, { useEffect, useRef, useState } from 'react';

export const CINEMATIC_HERO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4';

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
    const fadeDuration = 0.5;

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
        nextOpacity = Math.max(0, Math.min(1, currentTime / fadeDuration));
      } else if (duration - currentTime < fadeDuration) {
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
    <div className={`pointer-events-none absolute overflow-hidden ${className}`} style={style} aria-hidden="true">
      <video
        ref={videoRef}
        className={`h-full w-full object-cover ${videoClassName}`}
        src={src}
        muted
        playsInline
        preload="metadata"
        style={{ opacity }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/10 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.16),transparent_36%),linear-gradient(90deg,rgba(2,6,23,0.92),rgba(2,6,23,0.38),rgba(2,6,23,0.86))]" />
    </div>
  );
};

export default CinematicVideoBackground;
