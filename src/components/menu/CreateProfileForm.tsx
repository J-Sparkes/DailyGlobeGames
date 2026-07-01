"use client";

import { useState } from "react";
import { createProfile } from "@/lib/profile-storage";

interface CreateProfileFormProps {
  onCreated: () => void;
}

export function CreateProfileForm({ onCreated }: CreateProfileFormProps) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    createProfile(trimmed, username.trim() || undefined);
    onCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-400">
        Create a profile to save your daily sweeps, add friends, and climb the
        rankings. Stored on this device until cloud sync is enabled.
      </p>

      <div>
        <label
          htmlFor="profile-display-name"
          className="mb-1.5 block text-sm font-medium text-slate-300"
        >
          Display name
        </label>
        <input
          id="profile-display-name"
          type="text"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            setError("");
          }}
          placeholder="Your name"
          maxLength={32}
          className="w-full rounded-lg border border-white/15 bg-black/50 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
        />
      </div>

      <div>
        <label
          htmlFor="profile-username"
          className="mb-1.5 block text-sm font-medium text-slate-300"
        >
          Username <span className="text-slate-500">(optional)</span>
        </label>
        <input
          id="profile-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="auto-generated if blank"
          maxLength={24}
          className="w-full rounded-lg border border-white/15 bg-black/50 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        className="touch-target w-full min-h-11 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
      >
        Create profile
      </button>
    </form>
  );
}
