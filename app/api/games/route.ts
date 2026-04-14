import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") ?? "lichess";
  const username  = searchParams.get("username");
  const limit     = parseInt(searchParams.get("limit") ?? "20", 10);

  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  try {
    if (platform === "chess.com") {
      // Get current month archive
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const archiveRes = await fetch(
        `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/${year}/${month}`,
        { headers: { "User-Agent": "BlunderLess/1.0" } }
      );
      if (!archiveRes.ok) return NextResponse.json({ error: "Failed to fetch games" }, { status: 502 });
      const archive = await archiveRes.json() as { games?: unknown[] };
      const games = (archive.games ?? []).slice(-limit);
      return NextResponse.json(games);
    }

    if (platform === "lichess") {
      const token = searchParams.get("token");
      const headers: Record<string, string> = { Accept: "application/x-ndjson" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(
        `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=${limit}&moves=true&clocks=false&evals=false&pgnInJson=false`,
        { headers }
      );
      if (!res.ok) return NextResponse.json({ error: "Failed to fetch games" }, { status: 502 });
      const text = await res.text();
      const games = text.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
      return NextResponse.json(games);
    }

    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  } catch (err) {
    console.error("/api/games error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
