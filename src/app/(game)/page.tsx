import { GameClient } from "@/components/game/GameClient";

export default function Home() {
  return (
    <div className="h-full pointer-events-none">
      <GameClient />
    </div>
  );
}
