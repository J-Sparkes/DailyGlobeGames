"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";

import { POV_COOLDOWN_MS } from "@/lib/globe-pov";

export function useGlobeUserControl(
  globeRef: RefObject<GlobeMethods | undefined>,
  globeReady: boolean,
) {
  const userInteractingRef = useRef(false);
  const lastInteractionRef = useRef(0);
  const povTimerRef = useRef<number | null>(null);
  const [povTick, setPovTick] = useState(0);

  useEffect(() => {
    if (!globeReady) return;

    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls();
    const schedulePovRefocus = () => {
      if (povTimerRef.current !== null) {
        window.clearTimeout(povTimerRef.current);
      }
      povTimerRef.current = window.setTimeout(() => {
        setPovTick((value) => value + 1);
        povTimerRef.current = null;
      }, POV_COOLDOWN_MS);
    };

    const onStart = () => {
      userInteractingRef.current = true;
      lastInteractionRef.current = Date.now();
      if (povTimerRef.current !== null) {
        window.clearTimeout(povTimerRef.current);
        povTimerRef.current = null;
      }
    };
    const onEnd = () => {
      userInteractingRef.current = false;
      lastInteractionRef.current = Date.now();
      schedulePovRefocus();
    };

    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);

    return () => {
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
      if (povTimerRef.current !== null) {
        window.clearTimeout(povTimerRef.current);
        povTimerRef.current = null;
      }
    };
  }, [globeRef, globeReady]);

  const shouldSkipPov = useCallback(() => {
    if (userInteractingRef.current) return true;
    return Date.now() - lastInteractionRef.current < POV_COOLDOWN_MS;
  }, []);

  return { shouldSkipPov, povTick };
}
