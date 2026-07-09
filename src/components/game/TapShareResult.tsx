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

interface TapShareResultProps {
  result: CompletedTapResult;
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
        onClick={onClick}
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

export function TapShareResult({ result }: TapShareResultProps) {
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
    <div className="mt-4 border-t border-white/10 pt-4">
      <p className="mb-3 text-sm font-medium text-slate-300">Share your score</p>
      <a
        href={cardUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackShare("card_image")}
        className="mb-3 inline-block text-xs font-medium text-sky-400 underline-offset-2 hover:underline"
      >
        Open share card image
      </a>
      <div className="flex flex-wrap gap-2">
        {canNativeShare && (
          <ShareButton label="Share…" onClick={handleNativeShare} />
        )}
        <ShareButton
          label={copied ? "Copied!" : "Copy"}
          onClick={handleCopy}
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
