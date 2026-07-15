"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { buildHuntPolygonStyleMap } from "@/lib/globe-polygon-styles";
import { findCountryIdAtLatLng } from "@/lib/country-at-point";
import { isTouchDevice, prefersReducedMotion } from "@/lib/device";
import { GLOBE } from "@/lib/design-tokens";
import { applyPolygonStyles } from "@/lib/styled-country-features";
import { useContainerDims } from "@/lib/use-container-dims";
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
  const [globeReady, setGlobeReady] = useState(false);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const dims = useContainerDims(containerRef);
  const interactiveRef = useRef(interactive);
  const onCountryClickRef = useRef(onCountryClick);

  useEffect(() => {
    interactiveRef.current = interactive;
    onCountryClickRef.current = onCountryClick;
  }, [interactive, onCountryClick]);

  const guessedIds = useMemo(
    () => new Set(guesses.map((guess) => guess.id.replace(/^guess-/, ""))),
    [guesses],
  );

  const polygonStyles = useMemo(
    () =>
      buildHuntPolygonStyleMap(
        guessedIds,
        hiddenCountryId,
        revealHidden,
        won,
      ),
    [guessedIds, hiddenCountryId, revealHidden, won],
  );

  const styledFeatures = useMemo(
    () => applyPolygonStyles(features, polygonStyles),
    [features, polygonStyles],
  );

  useEffect(() => {
    loadCountryFeatures().then(setFeatures).catch(() => setFeatures([]));
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

  const pointsData = useMemo(
    () =>
      guesses.map((guess) => ({
        ...guess,
        altitude: 0.025,
        size: 0.4,
      })),
    [guesses],
  );

  const pickCountry = useCallback(
    (lat: number, lng: number) => {
      if (!interactiveRef.current || features.length === 0) return;
      const countryId = findCountryIdAtLatLng(
        features,
        lat,
        lng,
        guessedIds,
      );
      if (countryId) {
        onCountryClickRef.current(countryId);
      }
    },
    [features, guessedIds],
  );

  const handlePolygonClick = useCallback(
    (polygon: object) => {
      if (!interactiveRef.current) return;
      const countryId = (polygon as CountryFeature).properties.countryId;
      onCountryClickRef.current(countryId);
    },
    [],
  );

  const handleGlobeClick = useCallback(
    (coords: { lat: number; lng: number } | null) => {
      if (!coords) return;
      pickCountry(coords.lat, coords.lng);
    },
    [pickCountry],
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
        onGlobeClick={handleGlobeClick}
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
