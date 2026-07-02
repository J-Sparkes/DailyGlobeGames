"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { HuntGlobeProps } from "@/components/map/HuntGlobe";
import type { TapGlobeProps } from "@/components/map/TapGlobe";
import type { WorldMapProps } from "@/components/map/WorldMap";

const WorldMap = dynamic(
  () =>
    import("@/components/map/WorldMap").then((mod) => ({
      default: mod.WorldMap,
    })),
  { ssr: false },
);

const TapGlobe = dynamic(
  () =>
    import("@/components/map/TapGlobe").then((mod) => ({
      default: mod.TapGlobe,
    })),
  { ssr: false },
);

const HuntGlobe = dynamic(
  () =>
    import("@/components/map/HuntGlobe").then((mod) => ({
      default: mod.HuntGlobe,
    })),
  { ssr: false },
);

export type GlobeGameMode = "sweep" | "tap" | "hunt";

interface GlobeShellState {
  sweep: WorldMapProps | null;
  tap: TapGlobeProps | null;
  hunt: HuntGlobeProps | null;
}

interface GlobeShellContextValue {
  activeMode: GlobeGameMode;
  setSweepGlobe: (props: WorldMapProps | null) => void;
  setTapGlobe: (props: TapGlobeProps | null) => void;
  setHuntGlobe: (props: HuntGlobeProps | null) => void;
}

const GlobeShellContext = createContext<GlobeShellContextValue | null>(null);

function modeFromPath(pathname: string): GlobeGameMode {
  if (pathname.startsWith("/tap")) return "tap";
  if (pathname.startsWith("/hunt")) return "hunt";
  return "sweep";
}

export function GlobeShellProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeMode = useMemo(() => modeFromPath(pathname), [pathname]);
  const [globes, setGlobes] = useState<GlobeShellState>({
    sweep: null,
    tap: null,
    hunt: null,
  });

  const setSweepGlobe = useCallback((props: WorldMapProps | null) => {
    setGlobes((current) => {
      if (current.sweep === props) return current;
      return { ...current, sweep: props };
    });
  }, []);

  const setTapGlobe = useCallback((props: TapGlobeProps | null) => {
    setGlobes((current) => {
      if (current.tap === props) return current;
      return { ...current, tap: props };
    });
  }, []);

  const setHuntGlobe = useCallback((props: HuntGlobeProps | null) => {
    setGlobes((current) => {
      if (current.hunt === props) return current;
      return { ...current, hunt: props };
    });
  }, []);

  const value = useMemo(
    () => ({
      activeMode,
      setSweepGlobe,
      setTapGlobe,
      setHuntGlobe,
    }),
    [activeMode, setSweepGlobe, setTapGlobe, setHuntGlobe],
  );

  return (
    <GlobeShellContext.Provider value={value}>
      <div className="relative h-full w-full overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          {globes.sweep && (
            <div
              className={`absolute inset-0 ${
                activeMode === "sweep" ? "" : "invisible pointer-events-none"
              }`}
              aria-hidden={activeMode !== "sweep"}
            >
              <WorldMap
                {...globes.sweep}
                isActive={activeMode === "sweep"}
              />
            </div>
          )}
          {globes.tap && (
            <div
              className={`absolute inset-0 ${
                activeMode === "tap" ? "" : "invisible pointer-events-none"
              }`}
              aria-hidden={activeMode !== "tap"}
            >
              <TapGlobe {...globes.tap} isActive={activeMode === "tap"} />
            </div>
          )}
          {globes.hunt && (
            <div
              className={`absolute inset-0 ${
                activeMode === "hunt" ? "" : "invisible pointer-events-none"
              }`}
              aria-hidden={activeMode !== "hunt"}
            >
              <HuntGlobe {...globes.hunt} isActive={activeMode === "hunt"} />
            </div>
          )}
        </div>
        <div className="relative z-10 h-full w-full pointer-events-none">{children}</div>
      </div>
    </GlobeShellContext.Provider>
  );
}

function useGlobeShellContext() {
  const context = useContext(GlobeShellContext);
  if (!context) {
    throw new Error("Globe shell hooks must be used within GlobeShellProvider");
  }
  return context;
}

export function useSweepGlobe(props: WorldMapProps | null) {
  const { setSweepGlobe } = useGlobeShellContext();

  useLayoutEffect(() => {
    setSweepGlobe(props);
    return () => setSweepGlobe(null);
  }, [props, setSweepGlobe]);
}

export function useTapGlobe(props: TapGlobeProps | null) {
  const { setTapGlobe } = useGlobeShellContext();

  useLayoutEffect(() => {
    setTapGlobe(props);
    return () => setTapGlobe(null);
  }, [props, setTapGlobe]);
}

export function useHuntGlobe(props: HuntGlobeProps | null) {
  const { setHuntGlobe } = useGlobeShellContext();

  useLayoutEffect(() => {
    setHuntGlobe(props);
    return () => setHuntGlobe(null);
  }, [props, setHuntGlobe]);
}
