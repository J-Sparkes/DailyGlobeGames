"use client";

import { getCountryDisplayName } from "@/lib/country-resolve";
import { getAllGameHistory } from "@/lib/game-history";
import {
  getBestHuntScore,
  getBestStreak,
  getBestTapScore,
  getHuntWinStreak,
  updateProfile,
} from "@/lib/profile-storage";
import type { UserProfile } from "@/types/profile";
import { useState } from "react";

interface ProfilePanelProps {
  profile: UserProfile | null;
  onProfileChange: () => void;
}

export function ProfilePanel({ profile, onProfileChange }: ProfilePanelProps) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");

  if (!profile) return null;

  const bestSweep = getBestStreak(profile);
  const bestTap = getBestTapScore(profile);
  const bestHunt = getBestHuntScore(profile);
  const huntStreak = getHuntWinStreak(profile);
  const history = getAllGameHistory();

  const handleSave = () => {
    updateProfile({ displayName, username });
    setEditing(false);
    onProfileChange();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500/20 text-xl font-semibold text-sky-200 ring-1 ring-sky-500/30">
          {profile.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
              />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
              />
            </div>
          ) : (
            <>
              <p className="truncate text-lg font-semibold text-white">
                {profile.displayName}
              </p>
              <p className="text-sm text-slate-400">@{profile.username}</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Best sweep
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
            {bestSweep}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Best tap
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
            {bestTap}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Best hunt
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
            {bestHunt}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Hunt streak
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
            {huntStreak}
          </p>
        </div>
      </div>

      {editing ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-lg bg-sky-500 py-2.5 text-sm font-semibold text-white"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex-1 rounded-lg border border-white/15 py-2.5 text-sm text-slate-300"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDisplayName(profile.displayName);
            setUsername(profile.username);
            setEditing(true);
          }}
          className="text-sm text-sky-400 hover:text-sky-300"
        >
          Edit profile
        </button>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-200">
          Daily game history
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">
            No completed games yet. Finish a daily game to see it here.
          </p>
        ) : (
          <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {history.map((game) => {
              const mode = game.mode ?? "sweep";
              const key = `${game.date}-${mode}`;

              return (
                <li
                  key={key}
                  className="rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-200">
                      {game.date}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      {mode}
                    </span>
                  </div>
                  {mode === "tap" ? (
                    <p className="mt-1 text-sm tabular-nums text-sky-300">
                      {game.totalScore ?? 0} pts
                    </p>
                  ) : mode === "hunt" ? (
                    <p className="mt-1 text-sm tabular-nums text-sky-300">
                      {game.won
                        ? `${game.huntScore ?? 0} pts · guess ${game.solvedOnGuess}`
                        : "Missed"}
                    </p>
                  ) : (
                    <>
                      <p className="mt-1 text-sm tabular-nums text-sky-300">
                        {game.streak ?? 0}{" "}
                        {(game.streak ?? 0) === 1 ? "country" : "countries"}
                      </p>
                      {(game.path?.length ?? 0) > 0 && (
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {game.path!.map(getCountryDisplayName).join(" → ")}
                        </p>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
