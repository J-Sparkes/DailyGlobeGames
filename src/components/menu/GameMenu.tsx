"use client";

import { useEffect, useState } from "react";
import { CreateProfileForm } from "@/components/menu/CreateProfileForm";
import { FriendsPanel } from "@/components/menu/FriendsPanel";
import { GuestHistoryPanel } from "@/components/menu/GuestHistoryPanel";
import { ProfilePanel } from "@/components/menu/ProfilePanel";
import { RankingsPanel } from "@/components/menu/RankingsPanel";
import { getProfile } from "@/lib/profile-storage";
import type { MenuTab } from "@/types/profile";
import type { UserProfile } from "@/types/profile";

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
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refreshProfile = () => setProfile(getProfile());

  useEffect(() => {
    if (open) {
      refreshProfile();
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

  return (
    <div
      className="welcome-backdrop fixed inset-0 z-50 flex justify-end"
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
            (profile ? (
              <ProfilePanel
                profile={profile}
                onProfileChange={refreshProfile}
              />
            ) : (
              <div className="space-y-6">
                <CreateProfileForm onCreated={refreshProfile} />
                <GuestHistoryPanel />
              </div>
            ))}

          {tab === "friends" && (
            <FriendsPanel onFriendsChange={refreshProfile} />
          )}

          {tab === "rankings" && <RankingsPanel />}
        </div>
      </aside>
    </div>
  );
}
