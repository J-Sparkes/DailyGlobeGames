"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HuntWelcomeModal } from "@/components/game/HuntWelcomeModal";
import { hasSeenWelcome, markWelcomeSeen } from "@/lib/welcome-storage";

const HuntGame = dynamic(
  () =>
    import("@/components/game/HuntGame").then((mod) => ({
      default: mod.HuntGame,
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

export function HuntGameClient() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!hasSeenWelcome("hunt")) {
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    markWelcomeSeen("hunt");
    setShowWelcome(false);
  };

  return (
    <div className="relative h-full w-full pointer-events-none">
      {showWelcome && <HuntWelcomeModal onClose={handleCloseWelcome} />}
      <HuntGame />
    </div>
  );
}
