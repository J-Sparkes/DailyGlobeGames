"use client";

import { useCallback, useState } from "react";
import type { CompletedHuntResult } from "@/types/hunt";
import {
  buildHuntShareText,
  copyHuntShareText,
  getHuntShareUrl,
  getHuntTwitterShareUrl,
  getHuntWhatsAppShareUrl,
  nativeHuntShare,
} from "@/lib/hunt-share-result";
import {
  getFacebookShareUrl,
  getLinkedInShareUrl,
} from "@/lib/share-result";

interface HuntShareResultProps {
  result: CompletedHuntResult;
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

export function HuntShareResult({ result }: HuntShareResultProps) {
  const [copied, setCopied] = useState(false);
  const shareText = buildHuntShareText(result);
  const shareUrl = getHuntShareUrl();

  const handleCopy = useCallback(async () => {
    const ok = await copyHuntShareText(shareText);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [shareText]);

  const handleNativeShare = useCallback(async () => {
    await nativeHuntShare(result);
  }, [result]);

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <p className="mb-3 text-sm font-medium text-slate-300">Share your hunt</p>
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
          href={getHuntTwitterShareUrl(shareText)}
        />
        <ShareButton
          label="WhatsApp"
          href={getHuntWhatsAppShareUrl(shareText)}
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
