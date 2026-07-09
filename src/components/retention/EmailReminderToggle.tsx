"use client";

import { useEffect, useState } from "react";
import { fetchEmailPreference, updateEmailPreference } from "@/lib/api/client";
import { trackEvent } from "@/lib/analytics";

export function EmailReminderToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
    void fetchEmailPreference()
      .then((data) => {
        setEnabled(Boolean(data.enabled));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = async () => {
    const next = !enabled;
    const ok = await updateEmailPreference(next, timezone);
    if (ok) {
      setEnabled(next);
      if (next) trackEvent("email_reminder_opt_in");
    }
  };

  return (
    <div className="rounded-lg border border-[var(--ui-border-subtle)] bg-[var(--ui-surface-raised)] px-3 py-3">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          disabled={loading}
          onChange={() => void toggle()}
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-medium text-[var(--ui-text-primary)]">
            Daily reminder email
          </span>
          <span className="mt-0.5 block text-xs text-[var(--ui-text-muted)]">
            One email when today&apos;s puzzles are ready (requires sign-in).
          </span>
        </span>
      </label>
    </div>
  );
}
