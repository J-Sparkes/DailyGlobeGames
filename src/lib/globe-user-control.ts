"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";

const POV_COOLDOWN_MS = 500;

export function useGlobeUserControl(
  globeRef: RefObject<GlobeMethods | undefined>,
  globeReady: boolean,
) {
  const userInteractingRef = useRef(false);
  const lastInteractionRef = useRef(0);

  useEffect(() => {
    if (!globeReady) return;

    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls();
    const onStart = () => {
      userInteractingRef.current = true;
      lastInteractionRef.current = Date.now();
    };
    const onEnd = () => {
      userInteractingRef.current = false;
      lastInteractionRef.current = Date.now();
    };

    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);

    return () => {
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
    };
  }, [globeRef, globeReady]);

  const shouldSkipPov = useCallback(() => {
    if (userInteractingRef.current) return true;
    return Date.now() - lastInteractionRef.current < POV_COOLDOWN_MS;
  }, []);

  return { shouldSkipPov };
}
