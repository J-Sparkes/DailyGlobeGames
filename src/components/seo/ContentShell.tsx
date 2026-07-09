import type { ReactNode } from "react";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";

export function ContentShell({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[var(--ui-bg-deep)] text-[var(--ui-text-primary)]">
      <main
        className={`mx-auto px-4 py-10 text-sm leading-relaxed text-slate-300 ${
          narrow ? "max-w-lg" : "max-w-2xl"
        }`}
      >
        <SiteHeader />
        {children}
        <SiteFooter />
      </main>
    </div>
  );
}
