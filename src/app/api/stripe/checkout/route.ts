import { NextResponse } from "next/server";
import { jsonError, requireAuthUser } from "@/lib/server/api-utils";

const STRIPE_API = "https://api.stripe.com/v1";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://dailyglobegames.com";
}

export async function POST() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
  if (!secretKey || !priceId) {
    return jsonError("Payments not configured", 503);
  }

  const { supabase, user } = await requireAuthUser();
  if (!supabase || !user) {
    return jsonError("Sign in required", 401);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  let customerId = profile?.stripe_customer_id as string | undefined;

  if (!customerId) {
    const params = new URLSearchParams();
    if (user.email) params.set("email", user.email);
    params.set("metadata[supabase_user_id]", user.id);

    const customerRes = await fetch(`${STRIPE_API}/customers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!customerRes.ok) {
      return jsonError("Could not create customer", 500);
    }

    const customer = (await customerRes.json()) as { id: string };
    customerId = customer.id;

    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const sessionParams = new URLSearchParams();
  sessionParams.set("mode", "subscription");
  sessionParams.set("customer", customerId);
  sessionParams.set("line_items[0][price]", priceId);
  sessionParams.set("line_items[0][quantity]", "1");
  sessionParams.set("success_url", `${siteUrl()}/archive?upgraded=1`);
  sessionParams.set("cancel_url", `${siteUrl()}/archive`);
  sessionParams.set("metadata[supabase_user_id]", user.id);

  const sessionRes = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: sessionParams.toString(),
  });

  if (!sessionRes.ok) {
    return jsonError("Could not create checkout session", 500);
  }

  const session = (await sessionRes.json()) as { url?: string };
  if (!session.url) {
    return jsonError("Checkout unavailable", 500);
  }

  return NextResponse.json({ url: session.url });
}
