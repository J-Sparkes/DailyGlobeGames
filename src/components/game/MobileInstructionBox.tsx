export interface MobileInstructionBoxProps {
  primary: string;
  secondary?: string;
}

export function MobileInstructionBox({
  primary,
  secondary,
}: MobileInstructionBoxProps) {
  return (
    <div
      className="mobile-instruction-box w-11/12 max-w-md rounded-xl border border-white/10 bg-[rgba(6,8,12,0.72)] px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div className="mobile-instruction-box__content min-h-[3.25rem] text-center">
        <p className="text-sm leading-snug text-[var(--ui-text-primary)]">
          {primary}
        </p>
        {secondary && (
          <p className="mt-1 text-xs leading-snug text-[var(--ui-text-muted)]">
            {secondary}
          </p>
        )}
      </div>
    </div>
  );
}
