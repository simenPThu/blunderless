import { NextRequest, NextResponse } from "next/server";

// NOTE: Stockfish WASM runs only in Node/browser environments with SharedArrayBuffer.
// For production, run analysis as a background job or use a sidecar service.
// This route returns a queued response; real analysis would be async.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { platform?: string; username?: string; gameId?: string };
    const { platform, username } = body;

    if (!platform || !username) {
      return NextResponse.json({ error: "platform and username are required" }, { status: 400 });
    }

    // In a real deployment: enqueue a background job here (e.g. BullMQ, Inngest, etc.)
    // For now, return a queued acknowledgement
    return NextResponse.json({
      ok: true,
      status: "queued",
      message: `Analysis queued for ${username} on ${platform}. Check back in a few minutes.`,
    });
  } catch (err) {
    console.error("/api/analyze error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("gameId");

  if (!gameId) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  }

  // TODO: look up stored analysis by gameId from DB
  // For now, return a 404 so the UI falls back to demo data
  return NextResponse.json({ error: "Game not found" }, { status: 404 });
}
