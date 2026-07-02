"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/device";

export function useCountUp(
  target: number,
  options: { duration?: number; enabled?: boolean } = {},
): number {
  const { duration = 800, enabled = true } = options;
  const [value, setValue] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) {
      setValue(target);
      return;
    }

    if (target === 0) {
      setValue(0);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, enabled]);

  return value;
}
