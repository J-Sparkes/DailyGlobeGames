import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      event?: string;
      payload?: Record<string, string | number>;
    };

    if (process.env.NODE_ENV === "development" && body.event) {
      console.info("[analytics]", body.event, body.payload ?? {});
    }
  } catch {
    // Ignore malformed analytics payloads
  }

  return new NextResponse(null, { status: 204 });
}
