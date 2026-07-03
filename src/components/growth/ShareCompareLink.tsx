"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { LeaderboardMode } from "@/types/profile";

interface ShareCompareLinkProps {
  mode: LeaderboardMode;
  date: string;
}

export function ShareCompareLink({ mode, date }: ShareCompareLinkProps) {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const buildUrl = useCallback(() => {
    if (!profile?.username) return "";
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL ?? "";
    return `${origin}/compare?user=${encodeURIComponent(profile.username)}&date=${date}&mode=${mode}`;
  }, [profile?.username, date, mode]);

  if (!profile?.username) return null;

  const handleCopy = async () => {
    const url = buildUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="mt-2 text-xs font-medium text-[var(--ui-accent-primary)] underline-offset-2 hover:underline"
    >
      {copied ? "Compare link copied!" : "Copy friend compare link"}
    </button>
  );
}

export function getReferralLink(username: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return `${origin}/?ref=${encodeURIComponent(username)}`;
}
