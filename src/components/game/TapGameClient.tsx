"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { TapWelcomeModal } from "@/components/game/TapWelcomeModal";
import { hasSeenWelcome, markWelcomeSeen } from "@/lib/welcome-storage";

const TapGame = dynamic(
  () =>
    import("@/components/game/TapGame").then((mod) => ({
      default: mod.TapGame,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-black text-sm text-slate-400">
        Loading map…
      </div>
    ),
  },
);

export function TapGameClient() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!hasSeenWelcome("tap")) {
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    markWelcomeSeen("tap");
    setShowWelcome(false);
  };

  return (
    <div className="relative h-full w-full pointer-events-none">
      {showWelcome && <TapWelcomeModal onClose={handleCloseWelcome} />}
      <TapGame />
    </div>
  );
}
