import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function addPremiumMonth(from: Date = new Date()): string {
  const next = new Date(from);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return next.toISOString();
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();

  // Verify Stripe signature manually via Stripe API constructEvent would need stripe package
  // For production, use stripe.webhooks.constructEvent. Here we parse JSON for MVP with secret header fallback.
  const webhookToken = request.headers.get("x-webhook-token");
  if (webhookToken !== secret) {
    // Allow Stripe CLI forwarding with stripe-signature in production via env check
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev) {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }
  }

  let event: {
    type: string;
    data: { object: Record<string, unknown> };
  };

  try {
    event = JSON.parse(body) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "invoice.paid"
  ) {
    const obj = event.data.object;
    const userId =
      (obj.metadata as Record<string, string> | undefined)?.supabase_user_id ??
      (obj.client_reference_id as string | undefined);

    if (userId) {
      await admin
        .from("profiles")
        .update({ premium_until: addPremiumMonth() })
        .eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
