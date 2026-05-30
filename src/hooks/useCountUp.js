import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function useCountUp(target, duration = 1.2) {
  const prefersReducedMotion = useReducedMotion();
  const [value, setValue] = useState(prefersReducedMotion ? target : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(target);
      return undefined;
    }

    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => setValue(Math.round(latest)),
    });

    return () => controls.stop();
  }, [duration, prefersReducedMotion, target]);

  return value;
}
