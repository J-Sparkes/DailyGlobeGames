"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { buildPolygonStyleMap } from "@/lib/globe-polygon-styles";
import { useGlobeUserControl } from "@/lib/globe-user-control";
import { isTouchDevice, prefersReducedMotion } from "@/lib/device";
import { setsEqual } from "@/lib/globe-constants";
import { getMapName } from "@/lib/country-resolve";
import { getFeatureCentroid } from "@/lib/geo-centroid";
import { applyPolygonStyles } from "@/lib/styled-country-features";
import { useContainerDims } from "@/lib/use-container-dims";
import { useThrottledHover } from "@/lib/use-throttled-hover";
import {
  loadCountryFeatures,
  type CountryFeature,
} from "@/lib/world-geographies";

const EUROPE_POV = { lat: 48, lng: 10, altitude: 2.5 };
const WIDE_ALTITUDE = 2.5;
const FOCUS_ALTITUDE = 1.75;

export interface WorldMapProps {
  claimedIds: Set<string>;
  highlightId: string | null;
  clickableIds: Set<string>;
  interactive: boolean;
  flashSuccessId?: string | null;
  flashInvalidId?: string | null;
  isActive?: boolean;
  onCountryClick: (countryId: string) => void;
  onInvalidCountryClick?: (countryId: string) => void;
}

function WorldMapComponent({
  claimedIds,
  highlightId,
  clickableIds,
  interactive,
  flashSuccessId = null,
  flashInvalidId = null,
  isActive = true,
  onCountryClick,
  onInvalidCountryClick,
}: WorldMapProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [pulse, setPulse] = useState(false);
  const [touch, setTouch] = useState(false);
  const [globeReady, setGlobeReady] = useState(false);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const dims = useContainerDims(containerRef);
  const { hoverId, setHover } = useThrottledHover();
  const { shouldSkipPov } = useGlobeUserControl(globeRef, globeReady);

  const countryIds = useMemo(
    () => features.map((feature) => feature.properties.countryId),
    [features],
  );

  const polygonStyles = useMemo(
    () =>
      buildPolygonStyleMap(
        countryIds,
        claimedIds,
        highlightId,
        clickableIds,
        hoverId,
        touch,
        pulse && !reducedMotion,
        flashSuccessId,
        flashInvalidId,
      ),
    [
      countryIds,
      claimedIds,
      highlightId,
      clickableIds,
      hoverId,
      touch,
      pulse,
      reducedMotion,
      flashSuccessId,
      flashInvalidId,
    ],
  );

  const styledFeatures = useMemo(
    () => applyPolygonStyles(features, polygonStyles),
    [features, polygonStyles],
  );

  useEffect(() => {
    setTouch(isTouchDevice());
  }, []);

  useEffect(() => {
    loadCountryFeatures().then(setFeatures);
  }, []);

  useEffect(() => {
    if (!highlightId || reducedMotion) return;

    const interval = window.setInterval(() => {
      setPulse((value) => !value);
    }, 900);

    return () => window.clearInterval(interval);
  }, [highlightId, reducedMotion]);

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

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !globeReady || features.length === 0 || shouldSkipPov()) {
      return;
    }

    const duration = reducedMotion ? 0 : 800;

    if (claimedIds.size === 0 && highlightId) {
      const mapName = getMapName(highlightId);
      if (!mapName) {
        globe.pointOfView(EUROPE_POV, duration);
        return;
      }

      const feature = features.find(
        (entry) => entry.properties.countryId === highlightId,
      );
      if (!feature) {
        globe.pointOfView(EUROPE_POV, duration);
        return;
      }

      const { lat, lng } = getFeatureCentroid(feature);
      globe.pointOfView({ lat, lng, altitude: WIDE_ALTITUDE }, duration);
      return;
    }

    const focusId = highlightId ?? [...claimedIds].at(-1);
    if (!focusId) {
      globe.pointOfView(EUROPE_POV, duration);
      return;
    }

    const mapName = getMapName(focusId);
    if (!mapName) return;

    const feature = features.find(
      (entry) => entry.properties.countryId === focusId,
    );
    if (!feature) return;

    const { lat, lng } = getFeatureCentroid(feature);
    globe.pointOfView({ lat, lng, altitude: FOCUS_ALTITUDE }, duration);
  }, [
    highlightId,
    claimedIds,
    features,
    globeReady,
    reducedMotion,
    shouldSkipPov,
  ]);

  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const isTouchNow = isTouchDevice();
    const renderer = globe.renderer();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const controls = globe.controls();
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 120;
    controls.maxDistance = 500;
    controls.rotateSpeed = isTouchNow ? 0.55 : 0.35;
    controls.zoomSpeed = isTouchNow ? 0.9 : 0.6;

    globe.pointOfView(EUROPE_POV, 0);
    setGlobeReady(true);
  }, []);

  const handlePolygonClick = useCallback(
    (polygon: object) => {
      if (!interactive) return;
      const countryId = (polygon as CountryFeature).properties.countryId;
      if (clickableIds.has(countryId)) {
        onCountryClick(countryId);
        return;
      }
      if (!claimedIds.has(countryId) && onInvalidCountryClick) {
        onInvalidCountryClick(countryId);
      }
    },
    [
      interactive,
      clickableIds,
      claimedIds,
      onCountryClick,
      onInvalidCountryClick,
    ],
  );

  const handlePolygonHover = useCallback(
    (polygon: object | null) => {
      if (!interactive || touch || !polygon) {
        setHover(null);
        return;
      }
      setHover((polygon as CountryFeature).properties.countryId);
    },
    [interactive, touch, setHover],
  );

  const polygonSideColor = useCallback(() => "rgba(0, 0, 0, 0)", []);

  return (
    <div
      ref={containerRef}
      className="globe-container absolute inset-0 h-full w-full overflow-hidden bg-black"
    >
      <Globe
        ref={globeRef}
        width={dims.width}
        height={dims.height}
        globeImageUrl="/earth-satellite.jpg"
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere
        atmosphereColor="lightskyblue"
        atmosphereAltitude={0.12}
        polygonsData={styledFeatures}
        polygonCapColor="capColor"
        polygonSideColor={polygonSideColor}
        polygonStrokeColor="strokeColor"
        polygonAltitude="polygonAltitude"
        polygonsTransitionDuration={reducedMotion ? 0 : 150}
        onGlobeReady={handleGlobeReady}
        onPolygonClick={handlePolygonClick}
        onPolygonHover={handlePolygonHover}
      />

      <div className="pointer-events-none absolute inset-0 space-vignette" />
    </div>
  );
}

function worldMapPropsEqual(
  prev: WorldMapProps,
  next: WorldMapProps,
): boolean {
  return (
    prev.interactive === next.interactive &&
    prev.highlightId === next.highlightId &&
    prev.flashSuccessId === next.flashSuccessId &&
    prev.flashInvalidId === next.flashInvalidId &&
    prev.isActive === next.isActive &&
    setsEqual(prev.claimedIds, next.claimedIds) &&
    setsEqual(prev.clickableIds, next.clickableIds) &&
    prev.onCountryClick === next.onCountryClick &&
    prev.onInvalidCountryClick === next.onInvalidCountryClick
  );
}

export const WorldMap = memo(WorldMapComponent, worldMapPropsEqual);
