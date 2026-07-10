"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { buildPolygonStyleMap } from "@/lib/globe-polygon-styles";
import { isTouchDevice, prefersReducedMotion } from "@/lib/device";
import { GLOBE } from "@/lib/design-tokens";
import { applyPolygonStyles } from "@/lib/styled-country-features";
import { useContainerDims } from "@/lib/use-container-dims";
import { altitudeForBoundsSpan } from "@/lib/globe-pov";
import { loadCountryFeatures } from "@/lib/world-geographies";

const DEFAULT_POV = { lat: 20, lng: 0, altitude: 2.5 };

const GREEN_SUCCESS_STYLE = {
  capColor: "rgba(61, 219, 135, 0.55)",
  strokeColor: "rgba(180, 255, 215, 0.95)",
  altitude: 0.018,
};

function TriviaGlobeComponent({
  interactive = true,
  pins = [],
  cameraTarget = null,
  successCountryId = null,
  isActive = true,
}) {
  const globeRef = useRef(undefined);
  const containerRef = useRef(null);
  const [features, setFeatures] = useState([]);
  const [globeReady, setGlobeReady] = useState(false);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const dims = useContainerDims(containerRef);
  const lastCameraKeyRef = useRef("");

  useEffect(() => {
    loadCountryFeatures().then(setFeatures);
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !globeReady) return;

    if (isActive) {
      globe.resumeAnimation();
      globe.controls().enabled = interactive;
      return;
    }

    globe.pauseAnimation();
    globe.controls().enabled = false;
  }, [interactive, isActive, globeReady]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !globeReady || !cameraTarget) return;

    const cameraKey = JSON.stringify(cameraTarget);
    if (cameraKey === lastCameraKeyRef.current) return;
    lastCameraKeyRef.current = cameraKey;

    const duration = reducedMotion ? 0 : (cameraTarget.durationMs ?? 1200);
    globe.pointOfView(
      {
        lat: cameraTarget.lat,
        lng: cameraTarget.lng,
        altitude: cameraTarget.altitude ?? altitudeForBoundsSpan(40),
      },
      duration,
    );
  }, [cameraTarget, globeReady, reducedMotion]);

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

    globe.pointOfView(DEFAULT_POV, 0);
    setGlobeReady(true);
  }, []);

  const polygonStyles = useMemo(
    () =>
      buildPolygonStyleMap(new Set(), null, new Set(), successCountryId, null),
    [successCountryId],
  );

  const styledFeatures = useMemo(() => {
    const styled = applyPolygonStyles(features, polygonStyles);
    if (!successCountryId) return styled;

    return styled.map((feature) => {
      if (feature.properties.countryId !== successCountryId) return feature;

      return {
        ...feature,
        capColor: GREEN_SUCCESS_STYLE.capColor,
        strokeColor: GREEN_SUCCESS_STYLE.strokeColor,
        polygonAltitude: GREEN_SUCCESS_STYLE.altitude,
      };
    });
  }, [features, polygonStyles, successCountryId]);

  const pointsData = useMemo(
    () =>
      pins.map((pin) => ({
        ...pin,
        altitude: 0.025,
        size: 0.42,
      })),
    [pins],
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

export const TriviaGlobe = memo(TriviaGlobeComponent);
