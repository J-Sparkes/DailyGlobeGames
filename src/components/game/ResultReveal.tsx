"use client";

import type { ReactNode } from "react";

export function ResultReveal({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  return (
    <div className={enabled ? "result-stagger" : undefined}>{children}</div>
  );
}
