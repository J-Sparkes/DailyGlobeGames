import { GlobeShellProvider } from "@/contexts/GlobeShellContext";
import { ArchiveGate } from "@/components/growth/ArchiveGate";

export default function GameLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-black text-slate-100">
      <GlobeShellProvider>
        <ArchiveGate>{children}</ArchiveGate>
      </GlobeShellProvider>
    </main>
  );
}
