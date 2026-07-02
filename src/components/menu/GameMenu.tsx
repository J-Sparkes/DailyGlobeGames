"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthPanel } from "@/components/menu/AuthPanel";
import { FriendsPanel } from "@/components/menu/FriendsPanel";
import { GuestHistoryPanel } from "@/components/menu/GuestHistoryPanel";
import { ProfilePanel } from "@/components/menu/ProfilePanel";
import { RankingsPanel } from "@/components/menu/RankingsPanel";
import { useAuth } from "@/contexts/AuthContext";
import { deleteAccountApi } from "@/lib/api/client";
import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";
import { getProfile } from "@/lib/profile-storage";
import type { MenuTab, UserProfile } from "@/types/profile";

interface GameMenuProps {
  open: boolean;
  onClose: () => void;
}

const TABS: { id: MenuTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "friends", label: "Friends" },
  { id: "rankings", label: "Rankings" },
];

export function GameMenu({ open, onClose }: GameMenuProps) {
  const [tab, setTab] = useState<MenuTab>("profile");
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null);
  const { profile: cloudProfile, refreshProfile } = useAuth();

  const refresh = () => {
    setLocalProfile(getProfile());
    void refreshProfile();
  };

  useEffect(() => {
    if (open) {
      refresh();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const hasProfile = Boolean(cloudProfile || localProfile);
  const profileForPanel = localProfile;

  return (
    <div
      className="welcome-backdrop pointer-events-auto fixed inset-0 z-50 flex justify-end"
      role="presentation"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Game menu"
        className="welcome-panel glass-panel overlay-safe-top overlay-safe-bottom flex h-full w-full max-w-md flex-col border-l border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overlay-safe-x flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Menu</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="touch-target flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="overlay-safe-x flex gap-1 border-b border-white/10 px-4 py-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                tab === item.id
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="overlay-safe-x min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {tab === "profile" &&
            (cloudProfile ? (
              <CloudProfileSummary onProfileChange={refresh} />
            ) : profileForPanel ? (
              <ProfilePanel
                profile={profileForPanel}
                onProfileChange={refresh}
              />
            ) : (
              <div className="space-y-6">
                <AuthPanel onReady={refresh} />
                <GuestHistoryPanel />
              </div>
            ))}

          {tab === "friends" && (
            <FriendsPanel onFriendsChange={refresh} />
          )}

          {tab === "rankings" && <RankingsPanel />}
        </div>

        <div className="overlay-safe-x border-t border-white/10 px-4 py-3 text-xs text-slate-500">
          <Link href="/privacy" className="hover:text-slate-300">
            Privacy
          </Link>
          <span className="mx-2">·</span>
          <Link href="/terms" className="hover:text-slate-300">
            Terms
          </Link>
        </div>

        {isUnlimitedPlaysEnabled() && (
          <div className="overlay-safe-x border-t border-white/10 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-200/80">
              Test mode
            </p>
            <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
              Unlimited replays enabled for development.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function CloudProfileSummary({ onProfileChange }: { onProfileChange: () => void }) {
  const { profile, signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);

  if (!profile) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500/20 text-xl font-semibold text-sky-200">
          {profile.displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold text-white">{profile.displayName}</p>
          <p className="text-sm text-slate-400">@{profile.username}</p>
        </div>
      </div>
      <p className="text-sm text-slate-400">
        Scores sync to your account and appear on global leaderboards.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex-1 rounded-lg border border-white/15 py-2 text-sm text-slate-300"
        >
          Sign out
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={async () => {
            if (!confirm("Delete your account and all cloud data permanently?")) {
              return;
            }
            setDeleting(true);
            try {
              await deleteAccountApi();
              onProfileChange();
            } finally {
              setDeleting(false);
            }
          }}
          className="flex-1 rounded-lg border border-red-500/30 py-2 text-sm text-red-400"
        >
          {deleting ? "Deleting…" : "Delete account"}
        </button>
      </div>
    </div>
  );
}
