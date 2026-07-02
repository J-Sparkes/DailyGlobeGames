import type { Metadata } from "next";
import { TapGameClient } from "@/components/game/TapGameClient";

export const metadata: Metadata = {
  title: "Tap",
  description: "Daily Tap — read a clue and tap the globe to guess the location.",
};

export default function TapPage() {
  return (
    <div className="h-full pointer-events-none">
      <TapGameClient />
    </div>
  );
}
