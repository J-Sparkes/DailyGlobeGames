import { GlobeShellProvider } from "@/contexts/GlobeShellContext";
import { ArchiveGate } from "@/components/growth/ArchiveGate";

export default function GameLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[var(--ui-bg-deep)] text-[var(--ui-text-primary)]">
      <GlobeShellProvider>
        <ArchiveGate>{children}</ArchiveGate>
      </GlobeShellProvider>
    </main>
  );
}
