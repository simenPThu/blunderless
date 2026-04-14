"use client";
import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AppShell, Breadcrumb } from "@/components/Nav";
import { Card, StatCard, ClassificationBadge, Badge, Skeleton } from "@/components/ui";
import { type MoveClassification, classificationMeta } from "@/lib/utils";

interface ProgressData {
  weeklyAccuracy: number[];
  weeklyLabels: string[];
  mistakeBreakdown: { theme: string; count: number; trend: "up" | "down" | "flat" }[];
  classBreakdown: Record<MoveClassification, number>;
  rating: { value: number; change: number }[];
  ratingLabels: string[];
  openingPerformance: { name: string; games: number; winRate: number; accuracy: number }[];
}

const DEMO: ProgressData = {
  weeklyAccuracy: [62, 67, 65, 72, 70, 75, 78],
  weeklyLabels:   ["Mar 1", "Mar 8", "Mar 15", "Mar 22", "Mar 29", "Apr 5", "Apr 12"],
  mistakeBreakdown: [
    { theme: "fork",          count: 12, trend: "down" },
    { theme: "pin",           count: 8,  trend: "down" },
    { theme: "back rank",     count: 7,  trend: "flat" },
    { theme: "hanging piece", count: 5,  trend: "down" },
    { theme: "king safety",   count: 4,  trend: "up"   },
    { theme: "promotion",     count: 2,  trend: "down" },
  ],
  classBreakdown: {
    brilliant: 4,
    great:     14,
    best:      182,
    excellent: 247,
    good:      398,
    inaccuracy:58,
    mistake:   41,
    blunder:   29,
  },
  rating: [
    { value: 1340, change: 0  },
    { value: 1355, change: 15 },
    { value: 1342, change: -13},
    { value: 1368, change: 26 },
    { value: 1380, change: 12 },
    { value: 1398, change: 18 },
    { value: 1420, change: 22 },
  ],
  ratingLabels: ["Mar 1","Mar 8","Mar 15","Mar 22","Mar 29","Apr 5","Apr 12"],
  openingPerformance: [
    { name: "Ruy López",      games: 14, winRate: 57, accuracy: 81 },
    { name: "Sicilian",       games: 12, winRate: 42, accuracy: 74 },
    { name: "Queen's Gambit", games: 8,  winRate: 62, accuracy: 78 },
    { name: "French Defense", games: 6,  winRate: 33, accuracy: 61 },
    { name: "King's Indian",  games: 5,  winRate: 60, accuracy: 79 },
  ],
};

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up")   return <TrendingUp   className="w-3.5 h-3.5 text-red-500"   />;
  if (trend === "down") return <TrendingDown  className="w-3.5 h-3.5 text-green-500" />;
  return <Minus className="w-3.5 h-3.5 text-stone-400" />;
}

const classColors: Record<MoveClassification, string> = {
  brilliant: "#06b6d4",
  great:     "#8b5cf6",
  best:      "#22c55e",
  excellent: "#84cc16",
  good:      "#a3a3a3",
  inaccuracy:"#facc15",
  mistake:   "#f97316",
  blunder:   "#ef4444",
};

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d ?? DEMO); setLoading(false); })
      .catch(() => { setData(DEMO); setLoading(false); });
  }, []);

  const d = data ?? DEMO;
  const accuracyChartData = d.weeklyLabels.map((label, i) => ({
    label, accuracy: d.weeklyAccuracy[i] ?? 0,
  }));
  const ratingChartData = d.ratingLabels.map((label, i) => ({
    label, rating: d.rating[i]?.value ?? 0,
  }));
  const totalMoves = Object.values(d.classBreakdown).reduce((a, b) => a + b, 0);
  const latestAccuracy = d.weeklyAccuracy.at(-1) ?? 0;
  const prevAccuracy   = d.weeklyAccuracy.at(-2) ?? 0;
  const accDelta = latestAccuracy - prevAccuracy;
  const latestRating = d.rating.at(-1)?.value ?? 0;
  const ratingDelta  = d.rating.at(-1)?.change ?? 0;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Breadcrumb items={[{ label: "Progress" }]} />

        <div className="mb-8">
          <h1 className="text-2xl font-black text-stone-900">Progress</h1>
          <p className="text-stone-500 text-sm mt-1">Track your improvement over time</p>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : (
            <>
              <StatCard
                label="Current accuracy"
                value={`${latestAccuracy}%`}
                trend={{ value: `${Math.abs(accDelta)}% this week`, positive: accDelta >= 0 }}
              />
              <StatCard
                label="Rating"
                value={latestRating}
                trend={{ value: `${ratingDelta >= 0 ? "+" : ""}${ratingDelta} this week`, positive: ratingDelta >= 0 }}
              />
              <StatCard
                label="Blunder rate"
                value={`${((d.classBreakdown.blunder / totalMoves) * 100).toFixed(1)}%`}
                sub="of all moves"
              />
              <StatCard
                label="Best+ moves"
                value={`${(((d.classBreakdown.brilliant + d.classBreakdown.great + d.classBreakdown.best) / totalMoves) * 100).toFixed(0)}%`}
                sub="brilliant / great / best"
              />
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Accuracy chart */}
          <Card className="p-6">
            <h2 className="font-bold text-stone-900 mb-5">Accuracy over time</h2>
            {loading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={accuracyChartData} margin={{ left: -20 }}>
                  <defs>
                    <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} axisLine={false} />
                  <YAxis domain={[50, 100]}  tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e7e5e4", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`${v}%`, "Accuracy"]}
                  />
                  <Area type="monotone" dataKey="accuracy" stroke="#f59e0b" strokeWidth={2} fill="url(#accGrad)" dot={{ fill: "#f59e0b", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Rating chart */}
          <Card className="p-6">
            <h2 className="font-bold text-stone-900 mb-5">Rating over time</h2>
            {loading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={ratingChartData} margin={{ left: -10 }}>
                  <defs>
                    <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} axisLine={false} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e7e5e4", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [v, "Rating"]}
                  />
                  <Area type="monotone" dataKey="rating" stroke="#22c55e" strokeWidth={2} fill="url(#ratingGrad)" dot={{ fill: "#22c55e", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Move class breakdown bar */}
          <Card className="lg:col-span-2 p-6">
            <h2 className="font-bold text-stone-900 mb-5">Move quality distribution</h2>
            {loading ? <Skeleton className="h-48" /> : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={(Object.entries(d.classBreakdown) as [MoveClassification, number][]).map(([c, n]) => ({
                      name: classificationMeta[c].label,
                      count: n,
                      fill: classColors[c],
                    }))}
                    margin={{ left: -20 }}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#78716c" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#78716c" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #e7e5e4", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [v, "moves"]}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {(Object.keys(d.classBreakdown) as MoveClassification[]).map((c) => (
                        <Cell key={c} fill={classColors[c]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(Object.entries(d.classBreakdown) as [MoveClassification, number][]).map(([c, n]) => (
                    <div key={c} className="flex items-center gap-1">
                      <ClassificationBadge c={c} />
                      <span className="text-xs text-stone-400">{((n / totalMoves) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Weakness trends */}
          <Card className="p-6">
            <h2 className="font-bold text-stone-900 mb-4">Weakness trends</h2>
            <p className="text-xs text-stone-400 mb-4">
              <TrendingDown className="w-3 h-3 inline text-green-500 mr-0.5" /> improving ·{" "}
              <TrendingUp   className="w-3 h-3 inline text-red-500   mr-0.5" /> getting worse
            </p>
            {loading ? (
              <div className="space-y-3">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-8"/>)}</div>
            ) : (
              <div className="space-y-3">
                {d.mistakeBreakdown.map(({ theme, count, trend }) => (
                  <div key={theme} className="flex items-center gap-3">
                    <TrendIcon trend={trend} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-stone-700 capitalize truncate">{theme}</span>
                        <span className="text-xs text-stone-400 ml-2 shrink-0">{count}x</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-stone-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            trend === "up" ? "bg-red-400" : trend === "down" ? "bg-green-400" : "bg-stone-400"
                          }`}
                          style={{ width: `${(count / (d.mistakeBreakdown[0]?.count ?? 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Opening performance */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="font-bold text-stone-900">Opening performance</h2>
          </div>
          <div className="divide-y divide-stone-100">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 flex gap-4">
                    <Skeleton className="flex-1 h-4" />
                    <Skeleton className="w-16 h-4" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                ))
              : d.openingPerformance.map((op) => (
                  <div key={op.name} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{op.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{op.games} games</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-stone-900">{op.winRate}%</p>
                      <p className="text-xs text-stone-400">win rate</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-stone-900">{op.accuracy}%</p>
                      <p className="text-xs text-stone-400">accuracy</p>
                    </div>
                    <Badge variant={op.winRate >= 50 ? "green" : "red"}>
                      {op.winRate >= 50 ? "Strong" : "Weak"}
                    </Badge>
                  </div>
                ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
