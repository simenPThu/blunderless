import Link from "next/link";
import { BarChart2, Brain, Puzzle, ChevronRight, Zap, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui";

const features = [
  {
    icon: Zap,
    title: "Stockfish-Powered Analysis",
    desc: "Every move in every game gets analysed at depth 18. Blunders, mistakes, inaccuracies — all graded instantly.",
  },
  {
    icon: Brain,
    title: "AI Move Explanations",
    desc: "Claude explains why a move was a blunder and what concept you missed — in plain English, not engine notation.",
  },
  {
    icon: Puzzle,
    title: "Targeted Puzzles",
    desc: "Get puzzles built around your specific weaknesses. Missed a fork? You'll drill forks until they're instinct.",
  },
  {
    icon: TrendingUp,
    title: "Weekly Progress Report",
    desc: "See exactly how your accuracy is trending over time and whether your weaknesses are improving.",
  },
];

const steps = [
  { n: "01", title: "Connect your account", desc: "Link your Chess.com or Lichess username. No password needed." },
  { n: "02", title: "Analyse your games",   desc: "We pull your last 50 games and run full engine analysis overnight." },
  { n: "03", title: "Get your report",      desc: "Your personalised coaching report lands in the dashboard every Monday." },
  { n: "04", title: "Drill your weaknesses", desc: "Work through targeted puzzles until the patterns become second nature." },
];

const classifications = [
  { symbol: "!!", label: "Brilliant", color: "text-cyan-500" },
  { symbol: "!",  label: "Great",     color: "text-violet-500" },
  { symbol: "✓",  label: "Best",      color: "text-green-600" },
  { symbol: "★",  label: "Excellent", color: "text-lime-600" },
  { symbol: "·",  label: "Good",      color: "text-stone-400" },
  { symbol: "?!", label: "Inaccuracy",color: "text-yellow-600" },
  { symbol: "?",  label: "Mistake",   color: "text-orange-500" },
  { symbol: "??", label: "Blunder",   color: "text-red-500" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-stone-900 text-lg tracking-tight">
            <span className="text-2xl">♞</span>
            <span>Blunder<span className="text-amber-500">Less</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-stone-600">
            <Link href="#features" className="hover:text-stone-900 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-stone-900 transition-colors">How it works</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-stone-600 hover:text-stone-900 transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link href="/onboarding">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Free during beta — no credit card required
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-stone-900 leading-tight tracking-tight mb-6">
          Stop repeating<br />the same <span className="text-amber-500">mistakes</span>
        </h1>
        <p className="text-xl text-stone-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          BlunderLess analyses every game you play, identifies your recurring weaknesses,
          and builds a personalised training plan — so you improve where it actually counts.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/onboarding">
            <Button size="lg" className="w-full sm:w-auto">
              Connect your account
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              View demo dashboard
            </Button>
          </Link>
        </div>

        {/* Move classification strip */}
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {classifications.map(({ symbol, label, color }) => (
            <div key={label} className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-full px-3 py-1 shadow-xs text-xs font-semibold">
              <span className={color}>{symbol}</span>
              <span className="text-stone-600">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n: "50", unit: "games", desc: "analysed per session" },
            { n: "8",  unit: "classifications", desc: "from brilliant to blunder" },
            { n: "30%", unit: "own positions", desc: "from your actual games" },
            { n: "∞",  unit: "puzzles", desc: "from Lichess open database" },
          ].map(({ n, unit, desc }) => (
            <div key={unit}>
              <p className="text-4xl font-black text-stone-900">{n}</p>
              <p className="text-sm font-semibold text-amber-600 mt-1">{unit}</p>
              <p className="text-xs text-stone-400 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black text-stone-900">Everything you need to improve</h2>
          <p className="text-stone-500 mt-3 text-lg">Not just an engine — a training system.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-stone-200 p-7 shadow-xs hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-stone-900 text-lg mb-2">{title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white border-y border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-stone-900">How it works</h2>
            <p className="text-stone-500 mt-3 text-lg">Set it up once. Get better every week.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map(({ n, title, desc }, i) => (
              <div key={n} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-stone-200 -translate-x-8 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white text-sm font-black flex items-center justify-center mb-4">
                    {n}
                  </div>
                  <h3 className="font-bold text-stone-900 mb-2">{title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-black text-stone-900 mb-4">Ready to stop blundering?</h2>
        <p className="text-stone-500 text-lg mb-8">Connect your Chess.com or Lichess account and get your first coaching report in minutes.</p>
        <Link href="/onboarding">
          <Button size="lg">
            Get started free
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <span className="text-lg">♞</span>
            <span className="font-semibold text-stone-500">BlunderLess</span>
          </div>
          <p>Built for chess players who want to actually improve.</p>
          <div className="flex gap-4">
            <Link href="/dashboard" className="hover:text-stone-600 transition-colors">Dashboard</Link>
            <Link href="/puzzles" className="hover:text-stone-600 transition-colors">Puzzles</Link>
            <Link href="/progress" className="hover:text-stone-600 transition-colors">Progress</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
