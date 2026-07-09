"use client";

import { useCallback, useState } from "react";
import type { CompletedDailyResult } from "@/lib/daily-play";
import { trackEvent } from "@/lib/analytics";
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
import { getShareCardUrl } from "@/lib/share-deep-link";

interface ShareResultProps {
  result: CompletedDailyResult;
  showCardPreview?: boolean;
  rewardPop?: boolean;
  compact?: boolean;
}

function ShareButton({
  label,
  onClick,
  href,
  className = "",
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const baseClassName =
    "share-btn touch-target inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--ui-border-subtle)] bg-[var(--ui-surface-raised)] px-4 py-2.5 text-sm font-medium text-[var(--ui-text-primary)] transition hover:border-[color-mix(in_srgb,var(--ui-accent-primary)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-accent-primary)_10%,transparent)]";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={`${baseClassName} ${className}`.trim()}
      >
        {label}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClassName} ${className}`.trim()}
    >
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
        Daily Globe Games · {result.date}
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

export function ShareResult({
  result,
  showCardPreview = false,
  rewardPop = false,
  compact = false,
}: ShareResultProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const shareText = buildShareText(result);
  const shareUrl = getShareUrl(result.date);
  const cardUrl = getShareCardUrl("sweep", result.date, result.streak);

  const trackShare = (channel: string) => {
    trackEvent("share_clicked", { mode: "sweep", channel });
  };

  const handleCopy = useCallback(async () => {
    const ok = await copyShareText(shareText);
    if (ok) {
      trackShare("copy");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [shareText]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      trackShare("copy_link");
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [shareUrl]);

  const handleNativeShare = useCallback(async () => {
    trackShare("native");
    await nativeShare(result);
  }, [result]);

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div
      className={`border-t border-[var(--ui-border-subtle)] pt-3 ${compact ? "share-compact mt-2 pt-2" : "mt-4 pt-4"}`}
    >
      <p
        className={`font-medium text-[var(--ui-text-primary)] ${compact ? "mb-2 text-xs" : "mb-3 text-sm"}`}
      >
        Share your sweep
      </p>

      {showCardPreview && <ShareCardPreview result={result} />}

      {!compact && (
        <div className="mt-3">
          <a
            href={cardUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare("card_image")}
            className="text-xs font-medium text-[var(--ui-accent-primary)] underline-offset-2 hover:underline"
          >
            Open share card image
          </a>
        </div>
      )}

      <div className={`share-actions flex flex-wrap gap-2 ${compact ? "" : "mt-3"}`}>
        {canNativeShare && (
          <ShareButton
            label="Share…"
            onClick={handleNativeShare}
            className={rewardPop ? "share-reward-pop" : ""}
          />
        )}
        <ShareButton
          label={copied ? "Copied!" : "Copy"}
          onClick={handleCopy}
          className={!canNativeShare && rewardPop ? "share-reward-pop" : ""}
        />
        <ShareButton
          label={linkCopied ? "Link copied!" : "Copy link"}
          onClick={handleCopyLink}
        />
        <ShareButton
          label="X / Twitter"
          href={getTwitterShareUrl(shareText)}
          onClick={() => trackShare("twitter")}
        />
        <ShareButton
          label="WhatsApp"
          href={getWhatsAppShareUrl(shareText)}
          onClick={() => trackShare("whatsapp")}
        />
        <ShareButton
          label="Facebook"
          href={getFacebookShareUrl(shareUrl)}
          onClick={() => trackShare("facebook")}
        />
        <ShareButton
          label="LinkedIn"
          href={getLinkedInShareUrl(shareUrl)}
          onClick={() => trackShare("linkedin")}
        />
      </div>
    </div>
  );
}
