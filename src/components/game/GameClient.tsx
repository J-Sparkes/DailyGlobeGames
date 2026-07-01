"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { WelcomeModal } from "@/components/game/WelcomeModal";
import { hasSeenWelcome, markWelcomeSeen } from "@/lib/welcome-storage";

const GeographyGame = dynamic(
  () =>
    import("@/components/game/GeographyGame").then((mod) => ({
      default: mod.GeographyGame,
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

export function GameClient() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!hasSeenWelcome("sweep")) {
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    markWelcomeSeen("sweep");
    setShowWelcome(false);
  };

  return (
    <div className="relative h-full w-full">
      {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}
      <GeographyGame />
    </div>
  );
}
