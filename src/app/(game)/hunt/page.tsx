import type { Metadata } from "next";
import { HuntGameClient } from "@/components/game/HuntGameClient";

export const metadata: Metadata = {
  title: "Hunt",
  description: "Daily Hunt — find a hidden country in three guesses using distance hints.",
};

export default function HuntPage() {
  return (
    <div className="h-full pointer-events-none">
      <HuntGameClient />
    </div>
  );
}
