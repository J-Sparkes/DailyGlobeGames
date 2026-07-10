import { GameClient } from "@/components/game/GameClient";

export default function BlitzPage() {
  return (
    <div className="h-full pointer-events-none">
      <GameClient gameMode="sweep_blitz" />
    </div>
  );
}
