"use client";

import { useState } from "react";
import { useAuth, importLocalHistoryIfNeeded } from "@/contexts/AuthContext";
import { upsertProfile } from "@/lib/api/client";
import { getAllGameHistory } from "@/lib/game-history";
import { createProfile, getProfile } from "@/lib/profile-storage";

interface AuthPanelProps {
  onReady: () => void;
}

export function AuthPanel({ onReady }: AuthPanelProps) {
  const { configured, user, profile, signInWithEmail, refreshProfile } =
    useAuth();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [localName, setLocalName] = useState("");

  if (!configured) {
    return (
      <LocalOnlyForm
        localName={localName}
        setLocalName={setLocalName}
        onReady={onReady}
      />
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            const result = await signInWithEmail(email.trim());
            setBusy(false);
            if (result.error) {
              setError(result.error);
              return;
            }
            setMessage("Check your email for a magic sign-in link.");
          }}
        >
          <p className="mb-4 text-sm text-slate-400">
            Sign in with your email to sync scores, friends, and leaderboards
            across devices.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-white/15 bg-black/50 px-4 py-3 text-base text-white"
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          {message && <p className="mt-2 text-sm text-sky-300">{message}</p>}
          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="touch-target mt-3 w-full min-h-11 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {busy ? "Sending…" : "Send magic link"}
          </button>
        </form>

        <LocalOnlyForm
          localName={localName}
          setLocalName={setLocalName}
          onReady={onReady}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setBusy(true);
          try {
            await upsertProfile({
              displayName: displayName.trim(),
              username: username.trim() || displayName.trim(),
            });
            if (getProfile() || getAllGameHistory().length > 0) {
              await importLocalHistoryIfNeeded();
            }
            await refreshProfile();
            onReady();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="text-sm text-slate-400">
          Choose a public username for leaderboards and friends.
        </p>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
          required
          minLength={2}
          className="w-full rounded-lg border border-white/15 bg-black/50 px-4 py-3 text-base text-white"
        />
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full rounded-lg border border-white/15 bg-black/50 px-4 py-3 text-base text-white"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="touch-target w-full min-h-11 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white"
        >
          {busy ? "Saving…" : "Complete setup"}
        </button>
      </form>
    );
  }

  return null;
}

function LocalOnlyForm({
  localName,
  setLocalName,
  onReady,
}: {
  localName: string;
  setLocalName: (v: string) => void;
  onReady: () => void;
}) {
  return (
    <div className="border-t border-white/10 pt-4">
      <p className="mb-2 text-xs text-slate-500">Or play locally on this device:</p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (localName.trim().length < 2) return;
          createProfile(localName.trim());
          onReady();
        }}
      >
        <input
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          placeholder="Display name"
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300"
        >
          Local
        </button>
      </form>
    </div>
  );
}
