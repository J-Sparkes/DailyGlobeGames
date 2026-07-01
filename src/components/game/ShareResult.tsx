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
    "touch-target inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-sky-500/40 hover:bg-sky-500/10 active:bg-sky-500/15";

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

export function ShareResult({ result }: ShareResultProps) {
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
    <div className="mt-4 border-t border-white/10 pt-4">
      <p className="mb-3 text-sm font-medium text-slate-300">Share your sweep</p>
      <div className="flex flex-wrap gap-2">
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
