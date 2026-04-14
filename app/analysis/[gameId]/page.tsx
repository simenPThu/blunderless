"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, SkipBack, SkipForward, Info } from "lucide-react";
import { Chessboard } from "react-chessboard";
import { AppShell, Breadcrumb } from "@/components/Nav";
import { Card, ClassificationBadge, AccuracyRing, Badge, Skeleton } from "@/components/ui";
import { type MoveClassification } from "@/lib/utils";

interface MoveData {
  index: number;
  san: string;
  fenBefore: string;
  fen: string;
  classification: MoveClassification;
  cpLoss: number;
  bestMoveSan: string;
  explanation?: {
    summary: string;
    concepts: string[];
    suggestion?: string;
  };
}

interface GameData {
  id: string;
  white: string;
  black: string;
  result: string;
  date: string;
  opening: string;
  url: string;
  whiteAccuracy: number;
  blackAccuracy: number;
  moves: MoveData[];
}

// Demo game data
const DEMO_MOVES: MoveData[] = [
  { index: 0, san: "e4",   fenBefore: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",   fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",   classification: "best",      cpLoss: 0,   bestMoveSan: "e4",   explanation: { summary: "The King's Pawn opening, one of the most popular moves in chess.", concepts: ["center control", "opening principles"] } },
  { index: 1, san: "e5",   fenBefore: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",   fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",   classification: "best",      cpLoss: 0,   bestMoveSan: "e5",   explanation: { summary: "Black mirrors White's move, claiming equal center space.", concepts: ["center control", "symmetry"] } },
  { index: 2, san: "Nf3",  fenBefore: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",  fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",  classification: "excellent", cpLoss: 5,   bestMoveSan: "Nf3",  explanation: { summary: "Developing the knight while attacking the e5 pawn.", concepts: ["piece development", "pawn attack"] } },
  { index: 3, san: "Nc6",  fenBefore: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",  fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",  classification: "best",      cpLoss: 0,   bestMoveSan: "Nc6",  explanation: { summary: "Defending the e5 pawn with the knight, developing a piece.", concepts: ["piece development", "pawn defense"] } },
  { index: 4, san: "Bb5",  fenBefore: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",  fen: "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",  classification: "best",      cpLoss: 0,   bestMoveSan: "Bb5",  explanation: { summary: "The Ruy López! White pins the knight and prepares to contest Black's center control.", concepts: ["pin", "piece development", "center control"] } },
  { index: 5, san: "a6",   fenBefore: "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",   fen: "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",   classification: "good",      cpLoss: 18,  bestMoveSan: "Nf6",  explanation: { summary: "Morphy's Defense — attacking the bishop and forcing it to commit.", concepts: ["space", "tempo"] } },
  { index: 6, san: "Bxc6", fenBefore: "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4", fen: "r1bqkbnr/1ppp1ppp/p1B5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4", classification: "inaccuracy", cpLoss: 45,  bestMoveSan: "Ba4",  explanation: { summary: "Trading the bishop for a knight gives Black the bishop pair. Ba4 was better to maintain the pin.", concepts: ["bishop pair", "piece trade", "pin"] } },
  { index: 7, san: "dxc6", fenBefore: "r1bqkbnr/1ppp1ppp/p1B5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4", fen: "r1bqkbnr/1pp2ppp/p1p5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5", classification: "best",      cpLoss: 0,   bestMoveSan: "dxc6", explanation: { summary: "Recapturing towards the center, giving Black a strong pawn center and the bishop pair.", concepts: ["pawn structure", "bishop pair", "recapture"] } },
  { index: 8, san: "d3",   fenBefore: "r1bqkbnr/1pp2ppp/p1p5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5",  fen: "r1bqkbnr/1pp2ppp/p1p5/4p3/4P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 0 5",  classification: "blunder",   cpLoss: 180, bestMoveSan: "O-O",  explanation: { summary: "d3 loses a full tempo. Castling immediately was necessary to protect the king — now Black can play d5 with a powerful center!", concepts: ["king safety", "tempo", "center control", "castling"] } },
];

const DEMO_GAME: GameData = {
  id: "demo",
  white: "You",
  black: "Opponent1234",
  result: "0-1",
  date: "Apr 12, 2026",
  opening: "Ruy López, Morphy Defense",
  url: "#",
  whiteAccuracy: 71,
  blackAccuracy: 85,
  moves: DEMO_MOVES,
};

const classificationColors: Record<MoveClassification, string> = {
  brilliant: "border-cyan-400 bg-cyan-50",
  great:     "border-violet-400 bg-violet-50",
  best:      "border-green-400 bg-green-50",
  excellent: "border-lime-400 bg-lime-50",
  good:      "border-stone-300 bg-white",
  inaccuracy:"border-yellow-400 bg-yellow-50",
  mistake:   "border-orange-400 bg-orange-50",
  blunder:   "border-red-400 bg-red-50",
};

export default function AnalysisPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMove, setCurrentMove] = useState(-1); // -1 = starting position
  const [boardWidth, setBoardWidth] = useState(480);

  useEffect(() => {
    const update = () => setBoardWidth(Math.min(480, window.innerWidth - 48));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (gameId === "demo" || !gameId) {
      setGame(DEMO_GAME);
      setLoading(false);
      return;
    }
    fetch(`/api/analyze?gameId=${encodeURIComponent(gameId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setGame(d ?? DEMO_GAME); setLoading(false); })
      .catch(() => { setGame(DEMO_GAME); setLoading(false); });
  }, [gameId]);

  const go = useCallback((dir: number) => {
    if (!game) return;
    setCurrentMove((prev) => Math.max(-1, Math.min(game.moves.length - 1, prev + dir)));
  }, [game]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft")  go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const currentFen = currentMove === -1
    ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    : (game?.moves[currentMove]?.fen ?? "");
  const move = currentMove >= 0 ? game?.moves[currentMove] : null;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Breadcrumb items={[
          { label: "Analysis", href: "/analysis" },
          { label: loading ? "Loading…" : `vs ${game?.black}`, },
        ]} />

        {loading ? (
          <div className="grid lg:grid-cols-[auto_1fr] gap-6">
            <Skeleton className="w-[480px] h-[480px] rounded-xl" />
            <div className="space-y-4">
              {Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-12 rounded-xl"/>)}
            </div>
          </div>
        ) : game && (
          <div className="grid lg:grid-cols-[auto_1fr] gap-6">
            {/* Board column */}
            <div className="flex flex-col gap-4">
              {/* Black player */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-900">{game.black}</span>
                <AccuracyRing value={game.blackAccuracy} size={40} />
              </div>

              {/* Board */}
              <div className="rounded-xl overflow-hidden shadow-sm border border-stone-200" style={{ width: boardWidth, height: boardWidth }}>
                <Chessboard
                  options={{
                    position: currentFen.split(" ")[0] ?? currentFen,
                    allowDragging: false,
                    boardStyle: { borderRadius: 0 },
                  }}
                />
              </div>

              {/* White player */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-900">{game.white}</span>
                <AccuracyRing value={game.whiteAccuracy} size={40} />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentMove(-1)}  className="flex-1 flex items-center justify-center h-9 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-colors text-stone-600" title="Start">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button onClick={() => go(-1)} className="flex-1 flex items-center justify-center h-9 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-colors text-stone-600" title="Previous (←)">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => go(1)}  className="flex-1 flex items-center justify-center h-9 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-colors text-stone-600" title="Next (→)">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={() => setCurrentMove((game?.moves.length ?? 1) - 1)} className="flex-1 flex items-center justify-center h-9 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-colors text-stone-600" title="End">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-stone-400 text-center">Use arrow keys to navigate</p>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4 min-w-0">
              {/* Game info */}
              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="font-bold text-stone-900 text-lg">{game.white} vs {game.black}</h1>
                    <p className="text-sm text-stone-500 mt-0.5">{game.opening}</p>
                    <p className="text-xs text-stone-400 mt-1">{game.date}</p>
                  </div>
                  <Badge variant={game.result === "1-0" ? "green" : game.result === "0-1" ? "red" : "stone"}>
                    {game.result}
                  </Badge>
                </div>
              </Card>

              {/* Move explanation */}
              {move && (
                <Card className={`p-5 border-l-4 ${classificationColors[move.classification]}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-black text-stone-900">
                      {Math.floor(move.index / 2) + 1}{move.index % 2 === 0 ? "." : "..."}{move.san}
                    </span>
                    <ClassificationBadge c={move.classification} />
                    {move.cpLoss > 0 && (
                      <span className="text-xs text-stone-400">−{move.cpLoss} cp</span>
                    )}
                  </div>
                  {move.explanation ? (
                    <>
                      <p className="text-sm text-stone-700 leading-relaxed mb-3">{move.explanation.summary}</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {move.explanation.concepts.map((c) => (
                          <Badge key={c} variant="amber" className="capitalize">{c}</Badge>
                        ))}
                      </div>
                      {move.explanation.suggestion && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                          <div>
                            <span className="font-semibold">Better: </span>
                            {move.bestMoveSan} — {move.explanation.suggestion}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-stone-500">Best move was <strong>{move.bestMoveSan}</strong></p>
                  )}
                </Card>
              )}

              {!move && currentMove === -1 && (
                <Card className="p-5">
                  <p className="text-sm text-stone-500">Use the arrows or keyboard to step through moves.</p>
                </Card>
              )}

              {/* Move list */}
              <Card className="flex-1 overflow-hidden">
                <div className="px-5 py-3 border-b border-stone-100">
                  <h2 className="font-semibold text-stone-900 text-sm">Moves</h2>
                </div>
                <div className="overflow-y-auto max-h-80 p-3">
                  <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 gap-y-0.5 text-sm">
                    {Array.from({ length: Math.ceil(game.moves.length / 2) }, (_, i) => {
                      const w = game.moves[i * 2];
                      const b = game.moves[i * 2 + 1];
                      return (
                        <div key={i} className="contents">
                          <span className="text-stone-400 py-1 px-1 font-mono text-xs leading-7">{i + 1}.</span>
                          {[w, b].map((m, j) => m ? (
                            <button
                              key={j}
                              onClick={() => setCurrentMove(i * 2 + j)}
                              className={`text-left px-2 py-1 rounded-md text-sm font-medium transition-colors ${
                                currentMove === i * 2 + j
                                  ? "bg-amber-100 text-amber-800"
                                  : "hover:bg-stone-100 text-stone-700"
                              }`}
                            >
                              {m.san}{" "}
                              {(m.classification === "blunder" || m.classification === "mistake") && (
                                <span className={m.classification === "blunder" ? "text-red-500" : "text-orange-400"}>
                                  {m.classification === "blunder" ? "??" : "?"}
                                </span>
                              )}
                            </button>
                          ) : <div key={j} />)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
