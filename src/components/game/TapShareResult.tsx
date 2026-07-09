"use client";

import { useCallback, useState } from "react";
import type { CompletedTapResult } from "@/lib/tap-daily-play";
import { trackEvent } from "@/lib/analytics";
import {
  buildTapShareText,
  copyTapShareText,
  getTapShareUrl,
  getTapTwitterShareUrl,
  getTapWhatsAppShareUrl,
  nativeTapShare,
} from "@/lib/tap-share-result";
import {
  getFacebookShareUrl,
  getLinkedInShareUrl,
} from "@/lib/share-result";
import { getShareCardUrl } from "@/lib/share-deep-link";
import { MAX_TAP_SCORE } from "@/lib/tap-scoring";

interface TapShareResultProps {
  result: CompletedTapResult;
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

function TapShareCardPreview({ result }: { result: CompletedTapResult }) {
  return (
    <div className="share-card-pulse rounded-xl border border-[var(--ui-border-subtle)] bg-[var(--ui-surface-raised)] p-3">
      <p className="font-stat text-[10px] uppercase tracking-wider text-[var(--ui-text-muted)]">
        Daily Globe Games · Tap · {result.date}
      </p>
      <p className="font-stat mt-1 text-3xl font-semibold text-[var(--ui-accent-warm)]">
        {result.totalScore}
      </p>
      <p className="text-xs text-[var(--ui-text-muted)]">/ {MAX_TAP_SCORE} points</p>
    </div>
  );
}

export function TapShareResult({
  result,
  rewardPop = false,
  compact = false,
}: TapShareResultProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const shareText = buildTapShareText(result);
  const shareUrl = getTapShareUrl(result.date);
  const cardUrl = getShareCardUrl("tap", result.date, result.totalScore);

  const trackShare = (channel: string) => {
    trackEvent("share_clicked", { mode: "tap", channel });
  };

  const handleCopy = useCallback(async () => {
    const ok = await copyTapShareText(shareText);
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
    await nativeTapShare(result);
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
        Share your score
      </p>

      {!compact && <TapShareCardPreview result={result} />}

      {!compact && (
        <a
          href={cardUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackShare("card_image")}
          className="mt-3 inline-block text-xs font-medium text-[var(--ui-accent-primary)] underline-offset-2 hover:underline"
        >
          Open share card image
        </a>
      )}

      <div className={`share-actions flex flex-wrap gap-2 ${compact ? "mt-0" : "mt-3"}`}>
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
          href={getTapTwitterShareUrl(shareText)}
          onClick={() => trackShare("twitter")}
        />
        <ShareButton
          label="WhatsApp"
          href={getTapWhatsAppShareUrl(shareText)}
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
