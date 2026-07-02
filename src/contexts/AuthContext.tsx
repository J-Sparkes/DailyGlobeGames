"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { importLocalHistoryApi } from "@/lib/api/client";
import { getAllGameHistory } from "@/lib/game-history";
import { getProfile } from "@/lib/profile-storage";

export interface CloudProfile {
  id: string;
  username: string;
  displayName: string;
  createdAt: string;
}

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: CloudProfile | null;
  refreshProfile: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const supabase = useMemo(
    () => (configured ? createSupabaseBrowserClient() : null),
    [configured],
  );

  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CloudProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!supabase) return;

    const res = await fetch("/api/profile");
    if (!res.ok) {
      setProfile(null);
      return;
    }

    const data = (await res.json()) as {
      profile: CloudProfile | null;
    };
    setProfile(data.profile);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    void refreshProfile();
  }, [user, refreshProfile]);

  const signInWithEmail = useCallback(
    async (email: string) => {
      if (!supabase) return { error: "Auth not configured" };

      const redirectTo = `${window.location.origin}/api/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });

      return { error: error?.message };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }, [supabase]);

  const value = useMemo(
    () => ({
      configured,
      loading,
      user,
      profile,
      refreshProfile,
      signInWithEmail,
      signOut,
    }),
    [configured, loading, user, profile, refreshProfile, signInWithEmail, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export async function importLocalHistoryIfNeeded() {
  if (!getProfile() && getAllGameHistory().length === 0) return;
  const history = getAllGameHistory();
  if (history.length === 0) return;
  await importLocalHistoryApi(history);
}
