"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, RefreshCw, Loader2 } from "lucide-react";
import { AppShell, Breadcrumb } from "@/components/Nav";
import { Card, Badge, AccuracyRing, Button, Skeleton } from "@/components/ui";

interface GameSummary {
  id: string;
  opponent: string;
  result: "win" | "loss" | "draw";
  accuracy: number;
  date: string;
  blunders: number;
  mistakes: number;
  opening: string;
}

const DEMO_GAMES: GameSummary[] = [
  { id: "demo",  opponent: "Opponent1234", result: "loss", accuracy: 71, date: "Apr 12, 2026", blunders: 1, mistakes: 2, opening: "Ruy López" },
  { id: "g2",    opponent: "KnightRider99",result: "win",  accuracy: 84, date: "Apr 11, 2026", blunders: 1, mistakes: 1, opening: "Sicilian Defense" },
  { id: "g3",    opponent: "RookEnder",    result: "draw", accuracy: 79, date: "Apr 11, 2026", blunders: 0, mistakes: 3, opening: "Queen's Gambit" },
  { id: "g4",    opponent: "BishopMover",  result: "win",  accuracy: 91, date: "Apr 10, 2026", blunders: 0, mistakes: 1, opening: "Ruy López" },
  { id: "g5",    opponent: "TacticsKing",  result: "loss", accuracy: 55, date: "Apr 9, 2026",  blunders: 5, mistakes: 2, opening: "French Defense" },
];

function ResultBadge({ result }: { result: "win" | "loss" | "draw" }) {
  const map = { win: "green", loss: "red", draw: "stone" } as const;
  return <Badge variant={map[result]} className="capitalize">{result}</Badge>;
}

export default function AnalysisListPage() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysing, setAnalysing] = useState(false);

  useEffect(() => {
    fetch("/api/games")
      .then((r) => r.ok ? r.json() : null)
      .then((d: GameSummary[] | null) => { setGames(d ?? DEMO_GAMES); setLoading(false); })
      .catch(() => { setGames(DEMO_GAMES); setLoading(false); });
  }, []);

  async function triggerAnalysis() {
    setAnalysing(true);
    try {
      await fetch("/api/analyze", { method: "POST" });
    } finally {
      setAnalysing(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Breadcrumb items={[{ label: "Analysis" }]} />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-stone-900">Game Analysis</h1>
            <p className="text-stone-500 text-sm mt-1">Click any game for a move-by-move breakdown</p>
          </div>
          <Button onClick={triggerAnalysis} disabled={analysing} variant="secondary" size="sm">
            {analysing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {analysing ? "Analysing…" : "Re-analyse games"}
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="divide-y divide-stone-100">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4">
                    <Skeleton className="w-14 h-5 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="w-10 h-10 rounded-full" />
                  </div>
                ))
              : games.map((g) => (
                  <Link
                    key={g.id}
                    href={`/analysis/${g.id}`}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-stone-50 transition-colors group"
                  >
                    <ResultBadge result={g.result} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">vs {g.opponent}</p>
                      <p className="text-xs text-stone-400 truncate mt-0.5">{g.opening} · {g.date}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {g.blunders > 0 && (
                          <span className="text-xs font-medium text-red-500">{g.blunders} blunder{g.blunders !== 1 ? "s" : ""}</span>
                        )}
                        {g.mistakes > 0 && (
                          <span className="text-xs font-medium text-orange-500">{g.mistakes} mistake{g.mistakes !== 1 ? "s" : ""}</span>
                        )}
                        {g.blunders === 0 && g.mistakes === 0 && (
                          <span className="text-xs font-medium text-green-600">Clean game</span>
                        )}
                      </div>
                    </div>
                    <AccuracyRing value={g.accuracy} size={44} />
                    <ChevronRight className="w-4 h-4 text-stone-300 shrink-0 group-hover:text-stone-500 transition-colors" />
                  </Link>
                ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
