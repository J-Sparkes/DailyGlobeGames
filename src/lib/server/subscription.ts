import type { SupabaseClient } from "@supabase/supabase-js";
import { isPremiumActive } from "@/lib/server/premium";

export async function getUserPremiumStatus(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ premium: boolean; premiumUntil: string | null }> {
  const { data } = await supabase
    .from("profiles")
    .select("premium_until")
    .eq("id", userId)
    .maybeSingle();

  const premiumUntil = (data?.premium_until as string | null) ?? null;
  return {
    premium: isPremiumActive(premiumUntil),
    premiumUntil,
  };
}
