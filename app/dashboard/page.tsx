"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart2, ChevronRight, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  AppShell, Breadcrumb,
} from "@/components/Nav";
import {
  Card, StatCard, ClassificationBadge, AccuracyRing, Badge, Skeleton,
} from "@/components/ui";
import { type MoveClassification } from "@/lib/utils";
import { getAccount } from "@/lib/account";

interface GameSummary {
  id: string;
  opponent: string;
  result: "win" | "loss" | "draw";
  accuracy: number;
  date: string;
  blunders: number;
  mistakes: number;
  opening: string;
  url: string;
}

interface DashboardData {
  username: string;
  platform: "chess.com" | "lichess";
  rating: number;
  weeklyAccuracy: number;
  prevWeekAccuracy: number;
  blundersPerGame: number;
  totalGames: number;
  recentGames: GameSummary[];
  accuracyHistory: { date: string; accuracy: number }[];
  topWeaknesses: { theme: string; count: number }[];
  classificationCounts: Record<MoveClassification, number>;
}

// --- Demo data for when API is not yet connected ---
const DEMO: DashboardData = {
  username: "Demo Player",
  platform: "lichess",
  rating: 1420,
  weeklyAccuracy: 78,
  prevWeekAccuracy: 73,
  blundersPerGame: 1.4,
  totalGames: 47,
  recentGames: [
    { id: "g1", opponent: "KnightRider99", result: "win",  accuracy: 84, date: "Today",     blunders: 1, mistakes: 2, opening: "Sicilian Defense", url: "#" },
    { id: "g2", opponent: "RookEnder",     result: "loss", accuracy: 61, date: "Today",     blunders: 4, mistakes: 1, opening: "King's Indian",    url: "#" },
    { id: "g3", opponent: "PawnStar2024",  result: "draw", accuracy: 79, date: "Yesterday", blunders: 2, mistakes: 3, opening: "Queen's Gambit",   url: "#" },
    { id: "g4", opponent: "BishopMover",   result: "win",  accuracy: 91, date: "Yesterday", blunders: 0, mistakes: 1, opening: "Ruy López",        url: "#" },
    { id: "g5", opponent: "TacticsKing",   result: "loss", accuracy: 55, date: "Mon",       blunders: 5, mistakes: 2, opening: "French Defense",   url: "#" },
  ],
  accuracyHistory: [
    { date: "Mar 17", accuracy: 68 },
    { date: "Mar 18", accuracy: 72 },
    { date: "Mar 19", accuracy: 65 },
    { date: "Mar 20", accuracy: 75 },
    { date: "Mar 21", accuracy: 80 },
    { date: "Mar 22", accuracy: 73 },
    { date: "Mar 23", accuracy: 78 },
  ],
  topWeaknesses: [
    { theme: "fork",         count: 7 },
    { theme: "pin",          count: 5 },
    { theme: "back rank",    count: 4 },
    { theme: "hanging piece",count: 3 },
    { theme: "king safety",  count: 2 },
  ],
  classificationCounts: {
    brilliant: 2,
    great:     8,
    best:      94,
    excellent: 141,
    good:      230,
    inaccuracy:31,
    mistake:   22,
    blunder:   17,
  },
};

function ResultBadge({ result }: { result: "win" | "loss" | "draw" }) {
  const map = { win: "green", loss: "red", draw: "stone" } as const;
  const label = { win: "Win", loss: "Loss", draw: "Draw" };
  return <Badge variant={map[result]}>{label[result]}</Badge>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read connected account from localStorage and overlay on demo data
    const account = getAccount();
    const base: DashboardData = {
      ...DEMO,
      ...(account ? {
        username: account.username,
        platform: account.platform,
        ...(account.rating ? { rating: account.rating } : {}),
      } : {}),
    };

    fetch("/api/progress")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d ?? base); setLoading(false); })
      .catch(() => { setData(base); setLoading(false); });
  }, []);

  const d = data ?? DEMO;
  const accuracyDelta = d.weeklyAccuracy - d.prevWeekAccuracy;
  const totalMoves = Object.values(d.classificationCounts).reduce((a, b) => a + b, 0);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Breadcrumb items={[{ label: "Dashboard" }]} />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-stone-900">
              Welcome back, {d.username}
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Here's your weekly coaching report
            </p>
          </div>
          <Link href="/analysis">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors cursor-pointer">
              <Zap className="w-4 h-4" />
              Analyse new games
            </div>
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : (
            <>
              <StatCard
                label="Weekly accuracy"
                value={`${d.weeklyAccuracy}%`}
                trend={{ value: `${Math.abs(accuracyDelta)}% vs last week`, positive: accuracyDelta >= 0 }}
              />
              <StatCard label="Games played" value={d.totalGames} sub="last 30 days" />
              <StatCard
                label="Blunders / game"
                value={d.blundersPerGame.toFixed(1)}
                trend={{ value: "target: < 1.0", positive: d.blundersPerGame < 1 }}
              />
              <StatCard label="Rating" value={d.rating} sub={d.platform} />
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Accuracy chart */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-stone-900">Accuracy trend</h2>
                <p className="text-xs text-stone-400 mt-0.5">Last 7 days</p>
              </div>
              <BarChart2 className="w-4 h-4 text-stone-400" />
            </div>
            {loading ? (
              <Skeleton className="h-40" />
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={d.accuracyHistory} margin={{ left: -20 }}>
                  <defs>
                    <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} axisLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e7e5e4", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`${v}%`, "Accuracy"]}
                  />
                  <Area type="monotone" dataKey="accuracy" stroke="#f59e0b" strokeWidth={2} fill="url(#accuracyGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Accuracy ring + weaknesses */}
          <div className="flex flex-col gap-4">
            <Card className="p-6 flex flex-col items-center gap-3">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">This week</p>
              {loading ? <Skeleton className="w-20 h-20 rounded-full" /> : <AccuracyRing value={d.weeklyAccuracy} size={88} />}
              <div className={`flex items-center gap-1 text-sm font-medium ${accuracyDelta >= 0 ? "text-green-600" : "text-red-500"}`}>
                <TrendingUp className="w-3.5 h-3.5" />
                {accuracyDelta >= 0 ? "+" : ""}{accuracyDelta}% vs last week
              </div>
            </Card>

            <Card className="p-5 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-stone-900 text-sm">Top weaknesses</h3>
              </div>
              {loading ? (
                <div className="space-y-2">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-6" />)}</div>
              ) : (
                <div className="space-y-2.5">
                  {d.topWeaknesses.map(({ theme, count }) => (
                    <div key={theme} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-stone-700 capitalize">{theme}</span>
                          <span className="text-xs text-stone-400">{count}x</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-orange-400"
                            style={{ width: `${(count / d.topWeaknesses[0]!.count) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/puzzles" className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors">
                Drill these weaknesses
                <ChevronRight className="w-3 h-3" />
              </Link>
            </Card>
          </div>
        </div>

        {/* Move breakdown */}
        <Card className="p-6 mb-8">
          <h2 className="font-bold text-stone-900 mb-4">Move quality breakdown</h2>
          {loading ? <Skeleton className="h-12" /> : (
            <div className="flex rounded-lg overflow-hidden h-8">
              {(Object.entries(d.classificationCounts) as [MoveClassification, number][]).map(([c, n]) => {
                const pct = (n / totalMoves) * 100;
                if (pct < 1) return null;
                const colors: Record<MoveClassification, string> = {
                  brilliant: "bg-cyan-400",
                  great:     "bg-violet-400",
                  best:      "bg-green-500",
                  excellent: "bg-lime-500",
                  good:      "bg-stone-300",
                  inaccuracy:"bg-yellow-400",
                  mistake:   "bg-orange-400",
                  blunder:   "bg-red-500",
                };
                return (
                  <div
                    key={c}
                    className={`${colors[c]} flex items-center justify-center text-white text-xs font-bold`}
                    style={{ width: `${pct}%` }}
                    title={`${c}: ${n} (${pct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
          )}
          {!loading && (
            <div className="flex flex-wrap gap-3 mt-3">
              {(Object.entries(d.classificationCounts) as [MoveClassification, number][]).map(([c, n]) => (
                <div key={c} className="flex items-center gap-1">
                  <ClassificationBadge c={c} />
                  <span className="text-xs text-stone-400">{n}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent games */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-bold text-stone-900">Recent games</h2>
            <Link href="/analysis" className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4">
                    <Skeleton className="w-12 h-4" />
                    <Skeleton className="flex-1 h-4" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                ))
              : d.recentGames.map((g) => (
                  <Link
                    key={g.id}
                    href={`/analysis/${g.id}`}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-stone-50 transition-colors"
                  >
                    <ResultBadge result={g.result} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">vs {g.opponent}</p>
                      <p className="text-xs text-stone-400 truncate">{g.opening}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-stone-700">{g.accuracy}%</p>
                      <p className="text-xs text-stone-400">{g.date}</p>
                    </div>
                    {g.blunders > 0 && (
                      <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-red-500">
                        {g.blunders}??
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
                  </Link>
                ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
