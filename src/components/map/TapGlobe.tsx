"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { isTouchDevice, prefersReducedMotion } from "@/lib/device";
import { GLOBE, UI } from "@/lib/design-tokens";
import {
  expandTapMarkerLayers,
  HOLD_CONFIRM_MS,
  HOLD_MOVE_THRESHOLD_PX,
  povForRevealPair,
  TAP_PIN_SIZE,
  type TapRevealArc,
} from "@/lib/tap-globe-view";
import { useContainerDims } from "@/lib/use-container-dims";

const DEFAULT_POV = { lat: 20, lng: 0, altitude: 2.5 };
const HOLD_RING_RADIUS = 24;
const HOLD_RING_CIRCUMFERENCE = 2 * Math.PI * HOLD_RING_RADIUS;

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
  revealArc?: TapRevealArc | null;
  isActive?: boolean;
  onGlobeTap: (lat: number, lng: number) => void;
}

interface ActiveHold {
  lat: number;
  lng: number;
  screenX: number;
  screenY: number;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startedAt: number;
}

function TapGlobeComponent({
  interactive,
  markers,
  revealArc = null,
  isActive = true,
  onGlobeTap,
}: TapGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const dims = useContainerDims(containerRef);
  const [globeReady, setGlobeReady] = useState(false);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const holdRef = useRef<ActiveHold | null>(null);
  const holdRafRef = useRef<number | null>(null);
  const onGlobeTapRef = useRef(onGlobeTap);
  const interactiveRef = useRef(interactive);
  const [holdProgress, setHoldProgress] = useState(0);
  const [holdScreen, setHoldScreen] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [previewPin, setPreviewPin] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  useEffect(() => {
    onGlobeTapRef.current = onGlobeTap;
    interactiveRef.current = interactive;
  }, [onGlobeTap, interactive]);

  const holdDurationMs = reducedMotion ? 350 : HOLD_CONFIRM_MS;

  const clearHoldAnimation = useCallback(() => {
    if (holdRafRef.current !== null) {
      cancelAnimationFrame(holdRafRef.current);
      holdRafRef.current = null;
    }
  }, []);

  const restoreControls = useCallback(() => {
    const globe = globeRef.current;
    if (!globe || !globeReady) return;
    globe.controls().enabled = isActive;
  }, [globeReady, isActive]);

  const resetHold = useCallback(() => {
    clearHoldAnimation();
    holdRef.current = null;
    setHoldProgress(0);
    setHoldScreen(null);
    setPreviewPin(null);
    restoreControls();
  }, [clearHoldAnimation, restoreControls]);

  const completeHold = useCallback(
    (hold: ActiveHold) => {
      resetHold();
      onGlobeTapRef.current(hold.lat, hold.lng);
    },
    [resetHold],
  );

  const tickHold = useCallback(() => {
    const hold = holdRef.current;
    if (!hold) return;

    const progress = Math.min(
      1,
      (Date.now() - hold.startedAt) / holdDurationMs,
    );
    setHoldProgress(progress);

    if (progress >= 1) {
      completeHold(hold);
      return;
    }

    holdRafRef.current = requestAnimationFrame(tickHold);
  }, [completeHold, holdDurationMs]);

  const startHold = useCallback(
    (hold: ActiveHold) => {
      clearHoldAnimation();
      holdRef.current = hold;
      setHoldProgress(0);
      setHoldScreen({ x: hold.screenX, y: hold.screenY });
      setPreviewPin({ lat: hold.lat, lng: hold.lng });

      const globe = globeRef.current;
      if (globe) {
        globe.controls().enabled = false;
      }

      holdRafRef.current = requestAnimationFrame(tickHold);
    },
    [clearHoldAnimation, tickHold],
  );

  const updateHoldScreen = useCallback((screenX: number, screenY: number) => {
    setHoldScreen({ x: screenX, y: screenY });
    const hold = holdRef.current;
    if (hold) {
      hold.screenX = screenX;
      hold.screenY = screenY;
    }
  }, []);

  const resolveGlobeCoords = useCallback((clientX: number, clientY: number) => {
    const globe = globeRef.current;
    const container = containerRef.current;
    if (!globe || !container) return null;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const coords = globe.toGlobeCoords(x, y);
    if (!coords) return null;

    return { lat: coords.lat, lng: coords.lng, screenX: x, screenY: y };
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!interactiveRef.current || !globeReady || event.button !== 0) return;

      const coords = resolveGlobeCoords(event.clientX, event.clientY);
      if (!coords) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);

      startHold({
        lat: coords.lat,
        lng: coords.lng,
        screenX: coords.screenX,
        screenY: coords.screenY,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startedAt: Date.now(),
      });
    },
    [globeReady, resolveGlobeCoords, startHold],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const hold = holdRef.current;
      if (!hold || hold.pointerId !== event.pointerId) return;

      const moved = Math.hypot(
        event.clientX - hold.startClientX,
        event.clientY - hold.startClientY,
      );
      if (moved > HOLD_MOVE_THRESHOLD_PX) {
        resetHold();
        return;
      }

      const coords = resolveGlobeCoords(event.clientX, event.clientY);
      if (!coords) {
        resetHold();
        return;
      }

      hold.lat = coords.lat;
      hold.lng = coords.lng;
      updateHoldScreen(coords.screenX, coords.screenY);
      setPreviewPin({ lat: coords.lat, lng: coords.lng });
    },
    [resetHold, resolveGlobeCoords, updateHoldScreen],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const hold = holdRef.current;
      if (!hold || hold.pointerId !== event.pointerId) return;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const progress = Math.min(
        1,
        (Date.now() - hold.startedAt) / holdDurationMs,
      );
      if (progress < 1) {
        resetHold();
      }
    },
    [holdDurationMs, resetHold],
  );

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const hold = holdRef.current;
      if (!hold || hold.pointerId !== event.pointerId) return;
      resetHold();
    },
    [resetHold],
  );

  useEffect(() => {
    if (!interactive) {
      resetHold();
    }
  }, [interactive, resetHold]);

  useEffect(() => {
    return () => {
      clearHoldAnimation();
    };
  }, [clearHoldAnimation]);

  const markerLayers = useMemo(
    () => expandTapMarkerLayers(markers),
    [markers],
  );

  const pointsData = useMemo(() => {
    if (!previewPin) return markerLayers;

    return [
      ...markerLayers,
      {
        id: "hold-preview-shadow",
        lat: previewPin.lat,
        lng: previewPin.lng,
        color: "rgba(0, 0, 0, 0.55)",
        size: TAP_PIN_SIZE * 1.3,
        altitude: 0.016,
      },
      {
        id: "hold-preview-ring",
        lat: previewPin.lat,
        lng: previewPin.lng,
        color: "rgba(255, 255, 255, 0.85)",
        size: TAP_PIN_SIZE * 1.08,
        altitude: 0.021,
      },
      {
        id: "hold-preview",
        lat: previewPin.lat,
        lng: previewPin.lng,
        color: UI.accentPrimary,
        size: TAP_PIN_SIZE * 0.92,
        altitude: 0.026,
      },
    ];
  }, [markerLayers, previewPin]);

  const arcsData = useMemo(
    () => (revealArc ? [{ ...revealArc, id: "reveal" }] : []),
    [revealArc],
  );

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !globeReady) return;

    if (isActive) {
      globe.resumeAnimation();
      if (!holdRef.current) {
        globe.controls().enabled = true;
      }
      return;
    }

    globe.pauseAnimation();
    globe.controls().enabled = false;
  }, [isActive, globeReady]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !globeReady || !revealArc) return;

    const { lat, lng, altitude } = povForRevealPair(
      revealArc.startLat,
      revealArc.startLng,
      revealArc.endLat,
      revealArc.endLng,
    );

    globe.pointOfView({ lat, lng, altitude }, reducedMotion ? 0 : 900);
  }, [revealArc, globeReady, reducedMotion]);

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

  const arcDashAnimateTime = reducedMotion ? 0 : 750;
  const holdRingOffset =
    HOLD_RING_CIRCUMFERENCE * (1 - Math.min(1, holdProgress));

  return (
    <div
      ref={containerRef}
      className="globe-container absolute inset-0 h-full w-full overflow-hidden bg-black"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={(event) => event.preventDefault()}
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
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude="altitude"
        pointRadius="size"
        pointsTransitionDuration={reducedMotion ? 0 : 400}
        arcsData={arcsData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={() => [UI.accentPrimary, UI.success]}
        arcAltitudeAutoScale={0.42}
        arcStroke={0.55}
        arcDashLength={1}
        arcDashGap={1}
        arcDashInitialGap={1}
        arcDashAnimateTime={arcDashAnimateTime}
        arcsTransitionDuration={reducedMotion ? 0 : 500}
      />

      {holdScreen && interactive && (
        <div className="globe-hold-layer" aria-hidden>
          <div
            className="globe-hold-ring"
            style={{ left: holdScreen.x, top: holdScreen.y }}
          >
            <svg className="globe-hold-ring__svg" viewBox="0 0 56 56">
              <circle
                className="globe-hold-ring__track"
                cx="28"
                cy="28"
                r={HOLD_RING_RADIUS}
              />
              <circle
                className="globe-hold-ring__progress"
                cx="28"
                cy="28"
                r={HOLD_RING_RADIUS}
                strokeDasharray={HOLD_RING_CIRCUMFERENCE}
                strokeDashoffset={holdRingOffset}
              />
            </svg>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 space-vignette" />
    </div>
  );
}

function tapGlobePropsEqual(prev: TapGlobeProps, next: TapGlobeProps): boolean {
  return (
    prev.interactive === next.interactive &&
    prev.isActive === next.isActive &&
    prev.markers === next.markers &&
    prev.revealArc === next.revealArc &&
    prev.onGlobeTap === next.onGlobeTap
  );
}

export const TapGlobe = memo(TapGlobeComponent, tapGlobePropsEqual);
