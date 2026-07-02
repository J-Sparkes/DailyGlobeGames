"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { useGlobeUserControl } from "@/lib/globe-user-control";
import { isTouchDevice, prefersReducedMotion } from "@/lib/device";
import { GLOBE } from "@/lib/design-tokens";
import { useContainerDims } from "@/lib/use-container-dims";

const DEFAULT_POV = { lat: 20, lng: 0, altitude: 2.5 };

export interface GlobeMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  size: number;
}

export interface TapGlobeProps {
  interactive: boolean;
  markers: GlobeMarker[];
  isActive?: boolean;
  onGlobeTap: (lat: number, lng: number) => void;
}

function TapGlobeComponent({
  interactive,
  markers,
  isActive = true,
  onGlobeTap,
}: TapGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const dims = useContainerDims(containerRef);
  const [globeReady, setGlobeReady] = useState(false);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const { shouldSkipPov, povTick } = useGlobeUserControl(globeRef, globeReady);
  const lastMarkerKeyRef = useRef("");

  const pointsData = useMemo(
    () =>
      markers.map((marker) => ({
        ...marker,
        altitude: 0.02,
      })),
    [markers],
  );

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !globeReady) return;

    if (isActive) {
      globe.resumeAnimation();
      globe.controls().enabled = true;
      return;
    }

    globe.pauseAnimation();
    globe.controls().enabled = false;
  }, [isActive, globeReady]);

  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const isTouch = isTouchDevice();
    const renderer = globe.renderer();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const controls = globe.controls();
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 120;
    controls.maxDistance = 500;
    controls.rotateSpeed = isTouch ? 0.55 : 0.35;
    controls.zoomSpeed = isTouch ? 0.9 : 0.6;

    globe.pointOfView(DEFAULT_POV, 0);
    setGlobeReady(true);
  }, []);

  useEffect(() => {
    if (!globeReady || markers.length === 0 || shouldSkipPov()) return;

    const markerKey = `${povTick}:${markers
      .map((marker) => `${marker.id}:${marker.lat}:${marker.lng}`)
      .join("|")}`;
    if (markerKey === lastMarkerKeyRef.current) return;
    lastMarkerKeyRef.current = markerKey;

    const globe = globeRef.current;
    if (!globe) return;

    const duration = reducedMotion ? 0 : 600;
    const focus = markers.find((marker) => marker.id === "answer") ?? markers[0];
    if (!focus) return;

    globe.pointOfView(
      { lat: focus.lat, lng: focus.lng, altitude: 1.85 },
      duration,
    );
  }, [markers, globeReady, reducedMotion, shouldSkipPov, povTick]);

  const handleGlobeClick = useCallback(
    ({ lat, lng }: { lat: number; lng: number }) => {
      if (!interactive) return;
      onGlobeTap(lat, lng);
    },
    [interactive, onGlobeTap],
  );

  return (
    <div
      ref={containerRef}
      className="globe-container absolute inset-0 h-full w-full overflow-hidden bg-black"
    >
      <Globe
        ref={globeRef}
        width={dims.width}
        height={dims.height}
        globeImageUrl={GLOBE.imageUrl}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere
        atmosphereColor={GLOBE.atmosphereColor}
        atmosphereAltitude={GLOBE.atmosphereAltitude}
        onGlobeReady={handleGlobeReady}
        onGlobeClick={handleGlobeClick}
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude="altitude"
        pointRadius="size"
        pointsTransitionDuration={reducedMotion ? 0 : 400}
      />

      <div className="pointer-events-none absolute inset-0 space-vignette" />
    </div>
  );
}

function tapGlobePropsEqual(prev: TapGlobeProps, next: TapGlobeProps): boolean {
  return (
    prev.interactive === next.interactive &&
    prev.isActive === next.isActive &&
    prev.markers === next.markers &&
    prev.onGlobeTap === next.onGlobeTap
  );
}

export const TapGlobe = memo(TapGlobeComponent, tapGlobePropsEqual);
