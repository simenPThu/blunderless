import { NextRequest, NextResponse } from "next/server";
import { fetchLichessPuzzles } from "@/lib/puzzles/lichess";

// Fallback puzzles used when the Lichess API is unreachable.
const STATIC_PUZZLES = [
  {
    id: "static-1",
    source: "lichess" as const,
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    solution: ["e1e8"],
    themes: ["backRankMate", "mateIn1"],
    rating: 1150,
  },
  {
    id: "static-2",
    source: "lichess" as const,
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4",
    solution: ["h5f7"],
    themes: ["scholarsMate", "mateIn1"],
    rating: 1000,
  },
  {
    id: "static-3",
    source: "lichess" as const,
    fen: "r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1",
    solution: ["d5c7"],
    themes: ["fork", "knightEndgame"],
    rating: 1300,
  },
];

function themesForRating(rating: number): string[] {
  if (rating < 1000) return ["mateIn1", "backRankMate", "mateIn2"];
  if (rating < 1400) return ["fork", "pin", "skewer", "mateIn1", "mateIn2"];
  if (rating < 1800) return ["fork", "pin", "skewer", "discoveredAttack", "sacrifice", "deflection"];
  return ["zugzwang", "quietMove", "defensiveMove", "interference", "clearance"];
}

export async function GET(req: NextRequest) {
  const cookies = req.cookies;
  const rating = parseInt(cookies.get("bl_rating")?.value ?? "1500", 10);
  const token = cookies.get("bl_lichess_token")?.value;

  const themes = themesForRating(isNaN(rating) ? 1500 : rating);

  try {
    const puzzles = await fetchLichessPuzzles(themes, 10, token ? { token } : undefined);
    if (puzzles.length > 0) {
      return NextResponse.json(puzzles);
    }
  } catch {
    // Lichess unreachable — fall through to static puzzles
  }

  return NextResponse.json(STATIC_PUZZLES);
}
