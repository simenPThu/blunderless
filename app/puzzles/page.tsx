"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, XCircle, ChevronRight, RotateCcw, Lightbulb } from "lucide-react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { AppShell, Breadcrumb } from "@/components/Nav";
import { Card, Badge, Button } from "@/components/ui";

interface PuzzleData {
  id: string;
  source: "lichess" | "game";
  fen: string;
  solution: string[];
  themes: string[];
  rating: number;
  gameUrl?: string;
  blunderedMove?: string;
}


// Phase/length tags that are not useful as tactical hints
const PHASE_TAGS = new Set([
  "middlegame", "endgame", "opening", "short", "long", "veryLong",
  "master", "masterVsMaster", "superGM", "oneMove", "equality",
  "queenside", "kingside",
]);

type PuzzleState = "idle" | "thinking" | "correct" | "wrong" | "revealed";

function uciToMove(uci: string) {
  return {
    from: uci.slice(0, 2) as string,
    to: uci.slice(2, 4) as string,
    promotion: (uci[4] ?? undefined) as "q" | "r" | "b" | "n" | undefined,
  };
}

export default function PuzzlesPage() {
  const [puzzles, setPuzzles] = useState<PuzzleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [solutionStep, setSolutionStep] = useState(0);
  const [puzzleState, setPuzzleState] = useState<PuzzleState>("idle");
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [hint, setHint] = useState(false);
  const [boardWidth, setBoardWidth] = useState(460);
  // Bump this to trigger a board re-render after a move
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetch("/api/puzzles")
      .then((res) => res.json())
      .then((data: PuzzleData[]) => {
        setPuzzles(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const puzzle = puzzles[puzzleIndex];
  const chessRef = useRef<Chess | null>(null);

  // (Re-)initialise the chess instance whenever the puzzle changes.
  // We do this synchronously in render so chessRef is always consistent.
  const lastPuzzleId = useRef<string>("");
  if (puzzle && lastPuzzleId.current !== puzzle.id) {
    lastPuzzleId.current = puzzle.id;
    chessRef.current = new Chess(puzzle.fen);
  }

  // Board position derived directly from the chess instance — never stale
  const boardPosition = (chessRef.current ?? new Chess()).fen().split(" ")[0]!;
  const sideToMove = puzzle?.fen.split(" ")[1] === "b" ? "black" : "white";

  // Board width — responsive
  useEffect(() => {
    const update = () => setBoardWidth(Math.min(460, window.innerWidth - 48));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Reset state when puzzle changes
  useEffect(() => {
    setSolutionStep(0);
    setPuzzleState("idle");
    setHint(false);
    setTick((t) => t + 1);
  }, [puzzleIndex]);

  const playOpponentMove = useCallback((step: number) => {
    const uci = puzzles[puzzleIndex]?.solution[step];
    if (!uci || !chessRef.current) return;
    setTimeout(() => {
      try {
        chessRef.current!.move(uciToMove(uci));
        setTick((t) => t + 1);
        setPuzzleState("idle");
        setSolutionStep(step + 1);
      } catch {
        /* illegal — skip */
      }
    }, 600);
  }, [puzzleIndex, puzzles]);

  function onPieceDrop({ sourceSquare, targetSquare }: { piece: unknown; sourceSquare: string; targetSquare: string | null }): boolean {
    const from = sourceSquare;
    const to = targetSquare ?? "";
    if (puzzleState === "correct" || puzzleState === "revealed") return false;
    if (!chessRef.current || !puzzle || !to) return false;

    const expected = puzzle.solution[solutionStep];
    if (!expected) return false;

    const expectedFrom = expected.slice(0, 2);
    const expectedTo   = expected.slice(2, 4);
    const isCorrect    = from === expectedFrom && to === expectedTo;

    // Attempt the move in chess.js so we can display it; undo if wrong
    let moved = false;
    try {
      const result = chessRef.current.move({
        from,
        to,
        promotion: expected[4] as "q" | undefined,
      });
      moved = !!result;
    } catch {
      return false;
    }

    if (!moved) return false;
    setTick((t) => t + 1);

    if (!isCorrect) {
      setPuzzleState("wrong");
      setScore((s) => ({ ...s, wrong: s.wrong + 1 }));
      setTimeout(() => {
        chessRef.current?.undo();
        setTick((t) => t + 1);
        setPuzzleState("idle");
      }, 800);
      return true;
    }

    const nextStep = solutionStep + 1;
    if (nextStep >= puzzle.solution.length) {
      setPuzzleState("correct");
      setScore((s) => ({ ...s, correct: s.correct + 1 }));
    } else {
      setPuzzleState("thinking");
      playOpponentMove(nextStep);
    }
    return true;
  }

  function resetPuzzle() {
    if (!puzzle) return;
    chessRef.current = new Chess(puzzle.fen);
    lastPuzzleId.current = puzzle.id; // keep the id in sync
    setSolutionStep(0);
    setPuzzleState("idle");
    setHint(false);
    setTick((t) => t + 1);
  }

  function revealSolution() {
    if (!chessRef.current || !puzzle) return;
    setPuzzleState("revealed");
    chessRef.current = new Chess(puzzle.fen);
    setTick((t) => t + 1);
    let delay = 0;
    for (const uci of puzzle.solution) {
      delay += 800;
      setTimeout(() => {
        try {
          chessRef.current!.move(uciToMove(uci));
          setTick((t) => t + 1);
        } catch { /* skip */ }
      }, delay);
    }
  }

  function nextPuzzle() {
    if (puzzleIndex < puzzles.length - 1) {
      setPuzzleIndex((i) => i + 1);
    }
  }

  const tacticalTheme = puzzle?.themes.find((t) => !PHASE_TAGS.has(t));
  const isLastPuzzle = puzzleIndex >= puzzles.length - 1;

  // suppress the tick lint warning — it's purely a render trigger
  void tick;

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Breadcrumb items={[{ label: "Puzzles" }]} />
          <div className="flex items-center justify-center h-64 text-stone-500">
            Loading puzzles…
          </div>
        </div>
      </AppShell>
    );
  }

  if (!puzzle) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Breadcrumb items={[{ label: "Puzzles" }]} />
          <div className="flex items-center justify-center h-64 text-stone-500">
            No puzzles available. Try again later.
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Breadcrumb items={[{ label: "Puzzles" }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-stone-900">Puzzle Trainer</h1>
            <p className="text-stone-500 text-sm mt-1">Targeted puzzles based on your weaknesses</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-stone-900">{score.correct}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="font-semibold text-stone-900">{score.wrong}</span>
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-stone-500">{puzzleIndex + 1} / {puzzles.length}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start">
          {/* Board */}
          <div className="flex flex-col gap-3">
            <div className="rounded-xl overflow-hidden shadow-sm border border-stone-200" style={{ width: boardWidth, height: boardWidth }}>
              <Chessboard
                options={{
                  position: boardPosition,
                  onPieceDrop: onPieceDrop,
                  boardOrientation: sideToMove,
                  allowDragging: puzzleState !== "correct" && puzzleState !== "revealed",
                  boardStyle: { borderRadius: 0 },
                }}
              />
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={resetPuzzle} className="flex-1">
                <RotateCcw className="w-4 h-4" /> Reset
              </Button>
              <Button
                variant="secondary" size="sm" className="flex-1"
                onClick={() => setHint(true)}
                disabled={hint || puzzleState === "correct" || puzzleState === "revealed"}
              >
                <Lightbulb className="w-4 h-4" /> Hint
              </Button>
              <Button
                variant="ghost" size="sm" className="flex-1 text-stone-500"
                onClick={revealSolution}
                disabled={puzzleState === "correct" || puzzleState === "revealed"}
              >
                Show solution
              </Button>
              <Button
                variant="secondary" size="sm" className="flex-1"
                onClick={nextPuzzle}
                disabled={isLastPuzzle}
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Info panel */}
          <div className="flex flex-col gap-4">
            {/* Puzzle metadata */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                    {puzzle.source === "game" ? "From your games" : "Puzzle"}
                  </p>
                  <p className="font-bold text-stone-900">Rating: {puzzle.rating}</p>
                </div>
                {puzzle.source === "game" && (
                  <Badge variant="amber">Your game</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {puzzle.themes
                  .filter((t) => !PHASE_TAGS.has(t))
                  .map((t) => (
                    <Badge key={t} variant="default" className="capitalize">
                      {t.replace(/([A-Z])/g, " $1").trim()}
                    </Badge>
                  ))}
              </div>
              {puzzle.blunderedMove && (
                <div className="mt-3 text-sm text-stone-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                  <span className="font-semibold text-red-600">You played:</span>{" "}
                  {puzzle.blunderedMove}
                </div>
              )}
            </Card>

            {/* Instruction + hint */}
            <Card className="p-5">
              <p className="text-sm font-bold text-stone-700 mb-2">
                {sideToMove === "white" ? "White" : "Black"} to move — find the best continuation
              </p>
              {hint && (
                tacticalTheme ? (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Hint: look for a{" "}
                    <span className="font-semibold capitalize">
                      {tacticalTheme.replace(/([A-Z])/g, " $1").trim()}
                    </span>{" "}
                    motif.
                  </p>
                ) : (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Hint: look for the strongest attacking move.
                  </p>
                )
              )}
            </Card>

            {/* Feedback cards */}
            {puzzleState === "correct" && (
              <Card className="p-5 border-green-200 bg-green-50">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <p className="font-bold text-green-800 text-lg">Correct!</p>
                </div>
                <p className="text-sm text-green-700 mb-4">
                  {tacticalTheme
                    ? <>Nice work. You spotted the <span className="font-semibold capitalize">{tacticalTheme.replace(/([A-Z])/g, " $1").trim()}</span> motif.</>
                    : "Nice work. That's the best move!"}
                </p>
                <Button onClick={nextPuzzle} disabled={isLastPuzzle} className="w-full">
                  Next puzzle <ChevronRight className="w-4 h-4" />
                </Button>
              </Card>
            )}

            {puzzleState === "wrong" && (
              <Card className="p-5 border-red-200 bg-red-50">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <p className="font-semibold text-red-700">Not quite — try again</p>
                </div>
                <p className="text-xs text-red-600">Move undone. Keep looking!</p>
              </Card>
            )}

            {puzzleState === "revealed" && (
              <Card className="p-5 border-stone-200 bg-stone-50">
                <p className="font-semibold text-stone-700 mb-3">Solution shown</p>
                <Button onClick={nextPuzzle} variant="secondary" disabled={isLastPuzzle} className="w-full">
                  Next puzzle <ChevronRight className="w-4 h-4" />
                </Button>
              </Card>
            )}

            {isLastPuzzle && puzzleState === "correct" && (
              <Card className="p-5 border-amber-200 bg-amber-50 text-center">
                <p className="font-bold text-amber-800 text-lg mb-1">Session complete!</p>
                <p className="text-sm text-amber-700">
                  {score.correct} correct, {score.wrong} wrong.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
