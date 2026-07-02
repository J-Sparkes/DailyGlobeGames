"use client";

import { useCallback, useState } from "react";
import type { CompletedDailyResult } from "@/lib/daily-play";
import {
  buildShareText,
  copyShareText,
  getFacebookShareUrl,
  getLinkedInShareUrl,
  getShareUrl,
  getTwitterShareUrl,
  getWhatsAppShareUrl,
  nativeShare,
} from "@/lib/share-result";

interface ShareResultProps {
  result: CompletedDailyResult;
  showCardPreview?: boolean;
}

function ShareButton({
  label,
  onClick,
  href,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const className =
    "touch-target inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--ui-border-subtle)] bg-[var(--ui-surface-raised)] px-4 py-2.5 text-sm font-medium text-[var(--ui-text-primary)] transition hover:border-[color-mix(in_srgb,var(--ui-accent-primary)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-accent-primary)_10%,transparent)]";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}

function ShareCardPreview({ result }: { result: CompletedDailyResult }) {
  const blocks = Math.min(result.streak, 12);
  const grid = Array.from({ length: blocks }, (_, index) => (
    <span
      key={index}
      className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-[color-mix(in_srgb,var(--ui-accent-primary)_25%,transparent)] text-[10px]"
      aria-hidden
    >
      🌍
    </span>
  ));

  return (
    <div className="share-card-pulse mt-3 rounded-xl border border-[var(--ui-border-subtle)] bg-[var(--ui-surface-raised)] p-3">
      <p className="font-stat text-[10px] uppercase tracking-wider text-[var(--ui-text-muted)]">
        Daily Geography · {result.date}
      </p>
      <p className="font-stat mt-1 text-3xl font-semibold text-[var(--ui-accent-warm)]">
        {result.streak}
      </p>
      <p className="text-xs text-[var(--ui-text-muted)]">
        {result.streak === 1 ? "country swept" : "countries swept"}
      </p>
      {grid.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">{grid}</div>
      )}
    </div>
  );
}

export function ShareResult({ result, showCardPreview = false }: ShareResultProps) {
  const [copied, setCopied] = useState(false);
  const shareText = buildShareText(result);
  const shareUrl = getShareUrl();

  const handleCopy = useCallback(async () => {
    const ok = await copyShareText(shareText);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [shareText]);

  const handleNativeShare = useCallback(async () => {
    await nativeShare(result);
  }, [result]);

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="mt-4 border-t border-[var(--ui-border-subtle)] pt-4">
      <p className="mb-3 text-sm font-medium text-[var(--ui-text-primary)]">
        Share your sweep
      </p>

      {showCardPreview && <ShareCardPreview result={result} />}

      <div className="mt-3 flex flex-wrap gap-2">
        {canNativeShare && (
          <ShareButton label="Share…" onClick={handleNativeShare} />
        )}
        <ShareButton
          label={copied ? "Copied!" : "Copy"}
          onClick={handleCopy}
        />
        <ShareButton
          label="X / Twitter"
          href={getTwitterShareUrl(shareText)}
        />
        <ShareButton
          label="WhatsApp"
          href={getWhatsAppShareUrl(shareText)}
        />
        <ShareButton
          label="Facebook"
          href={getFacebookShareUrl(shareUrl)}
        />
        <ShareButton
          label="LinkedIn"
          href={getLinkedInShareUrl(shareUrl)}
        />
      </div>
    </div>
  );
}
