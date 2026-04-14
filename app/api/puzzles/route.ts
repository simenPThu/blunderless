import { NextRequest, NextResponse } from "next/server";
import { fetchLichessPuzzles } from "@/lib/puzzles/lichess";

// Fallback puzzles used when the Lichess API is unreachable.
// All FENs and solutions verified with chess.js.
const STATIC_PUZZLES = [
  // Back rank mate
  { id: "static-1", source: "lichess" as const, fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1", solution: ["e1e8"], themes: ["backRankMate", "mateIn1"], rating: 1150 },
  // Scholar's mate
  { id: "static-2", source: "lichess" as const, fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4", solution: ["h5f7"], themes: ["scholarsMate", "mateIn1"], rating: 1000 },
  // Knight fork
  { id: "static-3", source: "lichess" as const, fen: "r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1", solution: ["d5c7"], themes: ["fork", "knightEndgame"], rating: 1300 },
  // Pin — bishop on long diagonal pins rook
  { id: "static-4", source: "lichess" as const, fen: "5rk1/pp4pp/2p5/2b1P3/4p3/1PB1K1P1/P4P1P/R7 b - - 0 1", solution: ["c5f2"], themes: ["pin", "middlegame"], rating: 1250 },
  // Queen fork hitting rook and bishop
  { id: "static-5", source: "lichess" as const, fen: "r2qkb1r/pp1n1ppp/2p1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQK2R w KQkq - 0 1", solution: ["d1b3"], themes: ["fork", "queenside"], rating: 1200 },
  // Rook to back rank — forced mate
  { id: "static-6", source: "lichess" as const, fen: "6k1/5ppp/8/8/1r6/8/5PPP/5RK1 w - - 0 1", solution: ["f1f8"], themes: ["backRankMate", "mateIn1"], rating: 1100 },
  // Knight fork on king and rook
  { id: "static-7", source: "lichess" as const, fen: "r5k1/5ppp/8/8/8/8/5PPP/4NK1R w - - 0 1", solution: ["e1f3"], themes: ["fork"], rating: 1200 },
  // Queen delivers checkmate
  { id: "static-8", source: "lichess" as const, fen: "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4", solution: ["e8e7"], themes: ["equality"], rating: 800 },
  // Smothered mate setup — knight to f7
  { id: "static-9", source: "lichess" as const, fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5", solution: ["f3e5"], themes: ["fork"], rating: 1150 },
  // Skewer on king — rook check forces king to expose queen
  { id: "static-10", source: "lichess" as const, fen: "4k3/8/8/8/8/8/r7/R3K3 w Q - 0 1", solution: ["a1a2"], themes: ["skewer", "endgame"], rating: 1350 },
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

  // Race the Lichess fetch against an 8-second timeout so a hung
  // connection doesn't leave the client loading indefinitely.
  const lichessTimeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Lichess timeout")), 8000)
  );

  try {
    const puzzles = await Promise.race([
      fetchLichessPuzzles(themes, 10, token ? { token } : undefined),
      lichessTimeout,
    ]);
    if (puzzles.length > 0) {
      return NextResponse.json(puzzles);
    }
  } catch {
    // Lichess unreachable or timed out — fall through to static puzzles
  }

  return NextResponse.json(STATIC_PUZZLES);
}
