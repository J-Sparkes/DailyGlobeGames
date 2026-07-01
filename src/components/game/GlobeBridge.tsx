"use client";

import { memo } from "react";
import {
  useHuntGlobe,
  useSweepGlobe,
  useTapGlobe,
} from "@/contexts/GlobeShellContext";
import type { HuntGlobeProps } from "@/components/map/HuntGlobe";
import type { TapGlobeProps } from "@/components/map/TapGlobe";
import type { WorldMapProps } from "@/components/map/WorldMap";

export const SweepGlobeBridge = memo(function SweepGlobeBridge({
  props,
}: {
  props: WorldMapProps | null;
}) {
  useSweepGlobe(props);
  return null;
});

export const TapGlobeBridge = memo(function TapGlobeBridge({
  props,
}: {
  props: TapGlobeProps | null;
}) {
  useTapGlobe(props);
  return null;
});

export const HuntGlobeBridge = memo(function HuntGlobeBridge({
  props,
}: {
  props: HuntGlobeProps | null;
}) {
  useHuntGlobe(props);
  return null;
});
