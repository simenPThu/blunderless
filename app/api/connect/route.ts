import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { platform?: string; username?: string; token?: string };
    const { platform, username, token } = body;

    if (!platform || !username) {
      return NextResponse.json({ error: "platform and username are required" }, { status: 400 });
    }

    const trimmedUsername = username.trim();
    const trimmedToken = token?.trim() || undefined;

    // ── Chess.com ────────────────────────────────────────────────────────────
    if (platform === "chess.com") {
      const res = await fetch(
        `https://api.chess.com/pub/player/${encodeURIComponent(trimmedUsername)}`,
        { headers: { "User-Agent": "BlunderLess/1.0 chess-improvement-app" } }
      );
      if (!res.ok) {
        return NextResponse.json(
          { error: `Chess.com user "${trimmedUsername}" not found` },
          { status: 404 }
        );
      }
      const data = await res.json() as {
        username?: string;
        stats?: { chess_rapid?: { last?: { rating?: number } } };
      };

      const canonicalUsername = data.username ?? trimmedUsername;
      const response = NextResponse.json({
        ok: true,
        platform: "chess.com",
        username: canonicalUsername,
      });

      // Store platform + username in a regular cookie (public info, readable by server)
      response.cookies.set("bl_platform", "chess.com", {
        httpOnly: false, // readable client-side for redirects
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      response.cookies.set("bl_username", canonicalUsername, {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

    // ── Lichess ──────────────────────────────────────────────────────────────
    if (platform === "lichess") {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (trimmedToken) headers.Authorization = `Bearer ${trimmedToken}`;

      const res = await fetch(
        `https://lichess.org/api/user/${encodeURIComponent(trimmedUsername)}`,
        { headers }
      );
      if (!res.ok) {
        return NextResponse.json(
          { error: `Lichess user "${trimmedUsername}" not found` },
          { status: 404 }
        );
      }
      const data = await res.json() as {
        username?: string;
        perfs?: Record<string, { rating?: number }>;
      };

      const canonicalUsername = data.username ?? trimmedUsername;
      const rating =
        data.perfs?.rapid?.rating ??
        data.perfs?.blitz?.rating ??
        data.perfs?.bullet?.rating ??
        0;

      const response = NextResponse.json({
        ok: true,
        platform: "lichess",
        username: canonicalUsername,
        rating,
      });

      response.cookies.set("bl_platform", "lichess", {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      response.cookies.set("bl_username", canonicalUsername, {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      // Store the Lichess token in an httpOnly cookie so JavaScript can never read it.
      // The /api/games route will forward it server-side when fetching games.
      if (trimmedToken) {
        response.cookies.set("bl_lichess_token", trimmedToken, {
          httpOnly: true,   // ← JS cannot access this
          secure: process.env.NODE_ENV === "production", // HTTPS-only in prod
          sameSite: "strict",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
      }

      return response;
    }

    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  } catch (err) {
    console.error("/api/connect error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
