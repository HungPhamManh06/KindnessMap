import React, { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

export const AnimatedNumber = ({ value = 0, className = '', format = true, duration = 1.15 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? Number(value || 0) : 0);

  useEffect(() => {
    const nextValue = Number(value || 0);
    if (shouldReduceMotion) {
      setDisplayValue(nextValue);
      return undefined;
    }
    if (!inView) return undefined;

    const controls = animate(0, nextValue, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });

    return () => controls.stop();
  }, [value, inView, shouldReduceMotion, duration]);

  const text = format ? Number(displayValue || 0).toLocaleString('en-US') : String(displayValue);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
};

export default AnimatedNumber;
