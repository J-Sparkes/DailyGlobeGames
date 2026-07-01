"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { buildHuntPolygonStyleMap } from "@/lib/globe-polygon-styles";
import { useGlobeUserControl } from "@/lib/globe-user-control";
import { isTouchDevice, prefersReducedMotion } from "@/lib/device";
import { getFeatureCentroid } from "@/lib/geo-centroid";
import { applyPolygonStyles } from "@/lib/styled-country-features";
import { useContainerDims } from "@/lib/use-container-dims";
import { useThrottledHover } from "@/lib/use-throttled-hover";
import {
  loadCountryFeatures,
  type CountryFeature,
} from "@/lib/world-geographies";

const DEFAULT_POV = { lat: 20, lng: 0, altitude: 2.5 };

export interface HuntGuessMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color: string;
}

export interface HuntGlobeProps {
  interactive: boolean;
  guesses: HuntGuessMarker[];
  hiddenCountryId: string | null;
  revealHidden: boolean;
  won: boolean;
  isActive?: boolean;
  onCountryClick: (countryId: string) => void;
}

function HuntGlobeComponent({
  interactive,
  guesses,
  hiddenCountryId,
  revealHidden,
  won,
  isActive = true,
  onCountryClick,
}: HuntGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [touch, setTouch] = useState(false);
  const [globeReady, setGlobeReady] = useState(false);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const dims = useContainerDims(containerRef);
  const { hoverId, setHover } = useThrottledHover();
  const { shouldSkipPov } = useGlobeUserControl(globeRef, globeReady);
  const lastPovKeyRef = useRef("");

  const guessedIds = useMemo(
    () => new Set(guesses.map((guess) => guess.id.replace(/^guess-/, ""))),
    [guesses],
  );

  const countryIds = useMemo(
    () => features.map((feature) => feature.properties.countryId),
    [features],
  );

  const polygonStyles = useMemo(
    () =>
      buildHuntPolygonStyleMap(
        countryIds,
        guessedIds,
        hiddenCountryId,
        revealHidden,
        won,
        hoverId,
        touch,
        interactive,
      ),
    [
      countryIds,
      guessedIds,
      hiddenCountryId,
      revealHidden,
      won,
      hoverId,
      touch,
      interactive,
    ],
  );

  const styledFeatures = useMemo(
    () => applyPolygonStyles(features, polygonStyles),
    [features, polygonStyles],
  );

  useEffect(() => {
    setTouch(isTouchDevice());
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

    const isTouchDeviceNow = isTouchDevice();
    const renderer = globe.renderer();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const controls = globe.controls();
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 120;
    controls.maxDistance = 500;
    controls.rotateSpeed = isTouchDeviceNow ? 0.55 : 0.35;
    controls.zoomSpeed = isTouchDeviceNow ? 0.9 : 0.6;

    globe.pointOfView(DEFAULT_POV, 0);
    setGlobeReady(true);
  }, []);

  useEffect(() => {
    if (!globeReady || features.length === 0 || shouldSkipPov()) return;

    const globe = globeRef.current;
    if (!globe) return;

    const focusId =
      revealHidden && hiddenCountryId
        ? hiddenCountryId
        : guesses.length > 0
          ? guesses[guesses.length - 1]!.id.replace(/^guess-/, "")
          : null;

    const povKey = `${revealHidden}:${focusId ?? "default"}`;
    if (povKey === lastPovKeyRef.current) return;
    lastPovKeyRef.current = povKey;

    const duration = reducedMotion ? 0 : 600;

    if (!focusId) {
      globe.pointOfView(DEFAULT_POV, duration);
      return;
    }

    const feature = features.find(
      (entry) => entry.properties.countryId === focusId,
    );
    if (!feature) return;

    const { lat, lng } = getFeatureCentroid(feature);
    globe.pointOfView({ lat, lng, altitude: 1.85 }, duration);
  }, [
    globeReady,
    features,
    guesses,
    hiddenCountryId,
    revealHidden,
    reducedMotion,
    shouldSkipPov,
  ]);

  const pointsData = useMemo(
    () =>
      guesses.map((guess) => ({
        ...guess,
        altitude: 0.025,
        size: 0.4,
      })),
    [guesses],
  );

  const handlePolygonClick = useCallback(
    (polygon: object) => {
      if (!interactive) return;
      const countryId = (polygon as CountryFeature).properties.countryId;
      onCountryClick(countryId);
    },
    [interactive, onCountryClick],
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
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude="altitude"
        pointRadius="size"
        pointLabel="label"
        pointsTransitionDuration={reducedMotion ? 0 : 400}
      />

      <div className="pointer-events-none absolute inset-0 space-vignette" />
    </div>
  );
}

function huntGlobePropsEqual(
  prev: HuntGlobeProps,
  next: HuntGlobeProps,
): boolean {
  return (
    prev.interactive === next.interactive &&
    prev.hiddenCountryId === next.hiddenCountryId &&
    prev.revealHidden === next.revealHidden &&
    prev.won === next.won &&
    prev.isActive === next.isActive &&
    prev.guesses === next.guesses &&
    prev.onCountryClick === next.onCountryClick
  );
}

export const HuntGlobe = memo(HuntGlobeComponent, huntGlobePropsEqual);
