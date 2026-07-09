"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { buildPolygonStyleMap } from "@/lib/globe-polygon-styles";
import { isTouchDevice } from "@/lib/device";
import { setsEqual } from "@/lib/globe-constants";
import { applyPolygonStyles } from "@/lib/styled-country-features";
import { useContainerDims } from "@/lib/use-container-dims";
import { GLOBE } from "@/lib/design-tokens";
import {
  loadCountryFeatures,
  type CountryFeature,
} from "@/lib/world-geographies";

const EUROPE_POV = { lat: 48, lng: 10, altitude: 2.5 };

export interface WorldMapProps {
  claimedIds: Set<string>;
  highlightId: string | null;
  connectingIds: Set<string>;
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
  connectingIds,
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
  const [globeReady, setGlobeReady] = useState(false);
  const dims = useContainerDims(containerRef);

  const polygonStyles = useMemo(
    () =>
      buildPolygonStyleMap(
        claimedIds,
        highlightId,
        connectingIds,
        flashSuccessId,
        flashInvalidId,
      ),
    [claimedIds, highlightId, connectingIds, flashSuccessId, flashInvalidId],
  );

  const styledFeatures = useMemo(
    () => applyPolygonStyles(features, polygonStyles),
    [features, polygonStyles],
  );

  useEffect(() => {
    loadCountryFeatures().then(setFeatures);
  }, []);

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
        globeImageUrl={GLOBE.imageUrl}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere
        atmosphereColor={GLOBE.atmosphereColor}
        atmosphereAltitude={GLOBE.atmosphereAltitude}
        polygonsData={styledFeatures}
        polygonCapColor="capColor"
        polygonSideColor={polygonSideColor}
        polygonStrokeColor="strokeColor"
        polygonAltitude="polygonAltitude"
        polygonsTransitionDuration={0}
        onGlobeReady={handleGlobeReady}
        onPolygonClick={handlePolygonClick}
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
    setsEqual(prev.connectingIds, next.connectingIds) &&
    setsEqual(prev.clickableIds, next.clickableIds) &&
    prev.onCountryClick === next.onCountryClick &&
    prev.onInvalidCountryClick === next.onInvalidCountryClick
  );
}

export const WorldMap = memo(WorldMapComponent, worldMapPropsEqual);
