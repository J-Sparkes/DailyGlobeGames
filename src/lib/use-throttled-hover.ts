"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useThrottledHover(delayMs = 48) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const pendingIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearHoverTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const setHover = useCallback(
    (countryId: string | null) => {
      if (countryId !== null) {
        clearHoverTimeout();
        if (countryId === pendingIdRef.current && countryId === hoverId) {
          return;
        }
        pendingIdRef.current = countryId;
        timeoutRef.current = setTimeout(() => {
          setHoverId((current) =>
            current === pendingIdRef.current ? current : pendingIdRef.current,
          );
        }, delayMs);
        return;
      }

      pendingIdRef.current = null;

      if (hoverId === null) {
        clearHoverTimeout();
        return;
      }

      clearHoverTimeout();
      setHoverId(null);
    },
    [clearHoverTimeout, delayMs, hoverId],
  );

  useEffect(() => clearHoverTimeout, [clearHoverTimeout]);

  return { hoverId, setHover };
}
