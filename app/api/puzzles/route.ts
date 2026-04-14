import { NextResponse } from "next/server";

interface LichessDailyResponse {
  puzzle: {
    id: string;
    rating: number;
    solution: string[];
    themes: string[];
    fen: string;
  };
}

// Verified static fallback puzzles — always returned even if Lichess is unreachable.
// FENs and solutions confirmed valid with chess.js.
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

export async function GET() {
  // Try to fetch today's real Lichess puzzle (no auth required)
  try {
    const res = await fetch("https://lichess.org/api/puzzle/daily", {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (res.ok) {
      const data = await res.json() as LichessDailyResponse;
      const { puzzle } = data;

      // Map to our format and prepend to static puzzles
      const daily = {
        id: puzzle.id,
        source: "lichess" as const,
        fen: puzzle.fen,
        solution: puzzle.solution,
        themes: puzzle.themes,
        rating: puzzle.rating,
      };

      return NextResponse.json([daily, ...STATIC_PUZZLES]);
    }
  } catch {
    // Lichess unreachable — fall through to static puzzles
  }

  return NextResponse.json(STATIC_PUZZLES);
}
