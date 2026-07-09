import type { GameMode } from "@/lib/game-mode-instructions";
import { getGameModeInstruction } from "@/lib/game-mode-instructions";

export interface MobileInstructionBoxProps {
  mode: GameMode;
}

export function MobileInstructionBox({ mode }: MobileInstructionBoxProps) {
  const instruction = getGameModeInstruction(mode);

  return (
    <div
      className="mobile-instruction-box w-11/12 max-w-md rounded-xl border border-white/10 bg-[rgba(6,8,12,0.72)] px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <p className="mobile-instruction-box__text min-h-[3.25rem] text-center text-sm leading-snug text-[var(--ui-text-primary)]">
        {instruction}
      </p>
    </div>
  );
}
