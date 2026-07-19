"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { buildPolygonStyleMap, TRANSPARENT_POLYGON } from "@/lib/globe-polygon-styles";
import { findCountryIdAtLatLng } from "@/lib/country-at-point";
import { isTouchDevice } from "@/lib/device";
import { getFeatureCentroid } from "@/lib/geo-centroid";
import { setsEqual } from "@/lib/globe-constants";
import { GLOBE, MAP } from "@/lib/design-tokens";
import { simplifyCountryFeatures } from "@/lib/simplify-country-features";
import { useContainerDims } from "@/lib/use-container-dims";
import {
  loadCountryFeatures,
  type CountryFeature,
} from "@/lib/world-geographies";
import {
  povForCountryFeature,
  SWEEP_FALLBACK_POV,
} from "@/lib/globe-pov";

export interface WorldMapProps {
  claimedIds: Set<string>;
  highlightId: string | null;
  dailyCountryId: string | null;
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
  dailyCountryId,
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
  const [pickFeatures, setPickFeatures] = useState<CountryFeature[]>([]);
  const [displayFeatures, setDisplayFeatures] = useState<CountryFeature[]>([]);
  const [globeReady, setGlobeReady] = useState(false);
  const dims = useContainerDims(containerRef);
  const interactiveRef = useRef(interactive);
  const clickableIdsRef = useRef(clickableIds);
  const claimedIdsRef = useRef(claimedIds);
  const onCountryClickRef = useRef(onCountryClick);
  const onInvalidCountryClickRef = useRef(onInvalidCountryClick);

  useEffect(() => {
    interactiveRef.current = interactive;
    clickableIdsRef.current = clickableIds;
    claimedIdsRef.current = claimedIds;
    onCountryClickRef.current = onCountryClick;
    onInvalidCountryClickRef.current = onInvalidCountryClick;
  }, [
    interactive,
    clickableIds,
    claimedIds,
    onCountryClick,
    onInvalidCountryClick,
  ]);

  const displayById = useMemo(() => {
    const map = new Map<string, CountryFeature>();
    for (const feature of displayFeatures) {
      map.set(feature.properties.countryId, feature);
    }
    return map;
  }, [displayFeatures]);

  const pickById = useMemo(() => {
    const map = new Map<string, CountryFeature>();
    for (const feature of pickFeatures) {
      map.set(feature.properties.countryId, feature);
    }
    return map;
  }, [pickFeatures]);

  // Flash colors use points instead — including them here remeshed every
  // claimed+frontier country twice per correct guess.
  const polygonStyles = useMemo(
    () =>
      buildPolygonStyleMap(
        claimedIds,
        highlightId,
        connectingIds,
        null,
        null,
      ),
    [claimedIds, highlightId, connectingIds],
  );
  const styleRef = useRef(polygonStyles);
  styleRef.current = polygonStyles;

  // Geometry mesh set only changes when the country ID set changes — not when
  // a connecting country becomes the highlight (role/color-only update).
  const overlayIdsKey = useMemo(() => {
    const ids = new Set<string>(claimedIds);
    for (const id of connectingIds) ids.add(id);
    if (highlightId) ids.add(highlightId);
    return [...ids].sort().join("|");
  }, [claimedIds, connectingIds, highlightId]);

  const overlayPolygonsRef = useRef<CountryFeature[]>([]);
  const overlayPolygons = useMemo(() => {
    if (!overlayIdsKey) {
      overlayPolygonsRef.current = [];
      return overlayPolygonsRef.current;
    }
    if (displayById.size === 0) {
      // Features still loading — keep prior meshes to avoid a blank flash.
      return overlayPolygonsRef.current;
    }

    const polygons = overlayIdsKey
      .split("|")
      .map((id) => displayById.get(id))
      .filter((feature): feature is CountryFeature => Boolean(feature));

    overlayPolygonsRef.current = polygons;
    return polygons;
  }, [overlayIdsKey, displayById]);

  const flashPoints = useMemo(() => {
    const points: {
      id: string;
      lat: number;
      lng: number;
      color: string;
      size: number;
      altitude: number;
    }[] = [];

    const pushFlash = (countryId: string | null, color: string) => {
      if (!countryId) return;
      const feature = pickById.get(countryId) ?? displayById.get(countryId);
      if (!feature) return;
      const { lat, lng } = getFeatureCentroid(feature);
      points.push({
        id: `flash-${countryId}`,
        lat,
        lng,
        color,
        size: 0.55,
        altitude: 0.03,
      });
    };

    pushFlash(flashSuccessId, MAP.success.stroke);
    pushFlash(flashInvalidId, MAP.invalid.stroke);
    return points;
  }, [pickById, displayById, flashSuccessId, flashInvalidId]);

  useEffect(() => {
    loadCountryFeatures().then((loaded) => {
      setPickFeatures(loaded);
      setDisplayFeatures(simplifyCountryFeatures(loaded));
    });
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

  const applyInitialPov = useCallback(
    (countryId: string | null) => {
      const globe = globeRef.current;
      if (!globe || !globeReady) return;

      const feature = countryId ? pickById.get(countryId) : undefined;
      const pov = feature ? povForCountryFeature(feature) : SWEEP_FALLBACK_POV;
      globe.pointOfView(pov, 0);
    },
    [pickById, globeReady],
  );

  useEffect(() => {
    if (!globeReady || pickFeatures.length === 0) return;
    applyInitialPov(dailyCountryId);
  }, [dailyCountryId, globeReady, pickFeatures.length, applyInitialPov]);

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

    setGlobeReady(true);
  }, []);

  const resolveCountryClick = useCallback((countryId: string) => {
    if (!interactiveRef.current) return;

    if (clickableIdsRef.current.has(countryId)) {
      onCountryClickRef.current(countryId);
      return;
    }

    if (
      !claimedIdsRef.current.has(countryId) &&
      onInvalidCountryClickRef.current
    ) {
      onInvalidCountryClickRef.current(countryId);
    }
  }, []);

  // Polygon meshes swallow pointer hits — onGlobeClick alone never fires on
  // claimed/connecting countries. Keep onPolygonClick for those meshes.
  const handlePolygonClick = useCallback(
    (polygon: object) => {
      const countryId = (polygon as CountryFeature).properties.countryId;
      resolveCountryClick(countryId);
    },
    [resolveCountryClick],
  );

  const handleGlobeClick = useCallback(
    (coords: { lat: number; lng: number } | null) => {
      if (!coords || !interactiveRef.current || pickFeatures.length === 0) {
        return;
      }

      const countryId = findCountryIdAtLatLng(
        pickFeatures,
        coords.lat,
        coords.lng,
        clickableIdsRef.current,
      );
      if (!countryId) return;
      resolveCountryClick(countryId);
    },
    [pickFeatures, resolveCountryClick],
  );

  // Depend on polygonStyles so color/altitude accessors refresh without
  // replacing polygonsData (avoids GeoJSON remesh on highlight-only swaps).
  const polygonCapColor = useCallback(
    (polygon: object) => {
      const countryId = (polygon as CountryFeature).properties.countryId;
      return (
        styleRef.current.get(countryId)?.capColor ??
        TRANSPARENT_POLYGON.capColor
      );
    },
    [polygonStyles],
  );

  const polygonStrokeColor = useCallback(
    (polygon: object) => {
      const countryId = (polygon as CountryFeature).properties.countryId;
      return (
        styleRef.current.get(countryId)?.strokeColor ??
        TRANSPARENT_POLYGON.strokeColor
      );
    },
    [polygonStyles],
  );

  const polygonAltitude = useCallback(
    (polygon: object) => {
      const countryId = (polygon as CountryFeature).properties.countryId;
      return (
        styleRef.current.get(countryId)?.altitude ??
        TRANSPARENT_POLYGON.altitude
      );
    },
    [polygonStyles],
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
        polygonsData={overlayPolygons}
        polygonCapColor={polygonCapColor}
        polygonSideColor={polygonSideColor}
        polygonStrokeColor={polygonStrokeColor}
        polygonAltitude={polygonAltitude}
        polygonsTransitionDuration={0}
        pointsData={flashPoints}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude="altitude"
        pointRadius="size"
        pointsTransitionDuration={0}
        onGlobeReady={handleGlobeReady}
        onPolygonClick={handlePolygonClick}
        onGlobeClick={handleGlobeClick}
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
    prev.dailyCountryId === next.dailyCountryId &&
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
