"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

export function EmailReminderToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
    void fetch("/api/retention/email-preference")
      .then((res) => (res.ok ? res.json() : { enabled: false }))
      .then((data: { enabled: boolean }) => {
        setEnabled(Boolean(data.enabled));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = async () => {
    const next = !enabled;
    const res = await fetch("/api/retention/email-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next, timezone }),
    });
    if (res.ok) {
      setEnabled(next);
      if (next) trackEvent("email_reminder_opt_in");
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-3">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          disabled={loading}
          onChange={() => void toggle()}
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-medium text-slate-200">
            Daily reminder email
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            One email when today&apos;s puzzles are ready (requires sign-in).
          </span>
        </span>
      </label>
    </div>
  );
}
