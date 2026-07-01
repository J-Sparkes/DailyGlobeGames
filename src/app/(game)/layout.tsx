import { GlobeShellProvider } from "@/contexts/GlobeShellContext";

export default function GameLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-black text-slate-100">
      <GlobeShellProvider>{children}</GlobeShellProvider>
    </main>
  );
}
