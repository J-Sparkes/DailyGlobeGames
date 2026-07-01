"use client";

import { type RefObject, useEffect, useState } from "react";

function measureContainer(element: HTMLElement) {
  const { width, height } = element.getBoundingClientRect();
  return {
    width: Math.max(Math.floor(width), 1),
    height: Math.max(Math.floor(height), 1),
  };
}

export function useContainerDims(
  containerRef: RefObject<HTMLElement | null>,
  debounceMs = 150,
) {
  const [dims, setDims] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const commitDims = () => {
      const next = measureContainer(element);
      setDims((current) =>
        current.width === next.width && current.height === next.height
          ? current
          : next,
      );
    };

    const scheduleDims = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(commitDims, debounceMs);
    };

    commitDims();

    const observer = new ResizeObserver(scheduleDims);
    observer.observe(element);
    window.addEventListener("orientationchange", scheduleDims);
    window.addEventListener("resize", scheduleDims);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
      window.removeEventListener("orientationchange", scheduleDims);
      window.removeEventListener("resize", scheduleDims);
    };
  }, [containerRef, debounceMs]);

  return dims;
}
