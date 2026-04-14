"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { setAccount, getAccount } from "@/lib/account";

type Platform = "chess.com" | "lichess";
type Step = "platform" | "username" | "connecting" | "done";

const platforms: { id: Platform; name: string; icon: string; desc: string }[] = [
  {
    id: "chess.com",
    name: "Chess.com",
    icon: "♟",
    desc: "Connect via your public Chess.com username",
  },
  {
    id: "lichess",
    name: "Lichess",
    icon: "♞",
    desc: "Connect via your Lichess username (token optional for higher limits)",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("platform");
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If account already connected, skip straight to dashboard
  useEffect(() => {
    const existing = getAccount();
    if (existing) router.replace("/dashboard");
  }, [router]);

  async function handleConnect() {
    if (!username.trim() || !platform) return;
    setLoading(true);
    setError("");
    setStep("connecting");

    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          username: username.trim(),
          token: token.trim() || undefined,
        }),
      });

      const data = await res.json() as {
        ok?: boolean;
        error?: string;
        username?: string;
        rating?: number;
      };

      if (!res.ok) throw new Error(data.error ?? "Failed to connect");

      // Persist public account info in localStorage
      setAccount({
        platform,
        username: data.username ?? username.trim(),
        rating: data.rating,
      });

      setStep("done");
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("username");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <span className="text-3xl">♞</span>
        <span className="font-bold text-stone-900 text-xl tracking-tight">
          Blunder<span className="text-amber-500">Less</span>
        </span>
      </div>

      <Card className="w-full max-w-md p-8">
        {/* Platform + username steps */}
        {(step === "platform" || step === "username") && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-black text-stone-900 mb-1">Connect your account</h1>
              <p className="text-stone-500 text-sm">Choose where you play most</p>
            </div>

            <div className="grid gap-3 mb-6">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setPlatform(p.id); setStep("username"); }}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 text-left transition-all",
                    platform === p.id
                      ? "border-amber-500 bg-amber-50"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                  )}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">{p.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{p.desc}</p>
                  </div>
                  {platform === p.id && (
                    <CheckCircle className="w-5 h-5 text-amber-500 ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {step === "username" && platform && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    {platform === "chess.com" ? "Chess.com" : "Lichess"} username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                    placeholder="e.g. MagnusCarlsen"
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-200 bg-white text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  />
                </div>

                {platform === "lichess" && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      Personal access token{" "}
                      <span className="text-stone-400 font-normal">(optional — higher rate limits)</span>
                    </label>
                    <input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="lip_..."
                      autoComplete="off"
                      className="w-full px-3 py-2.5 rounded-lg border border-stone-200 bg-white text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                    />
                    <p className="text-xs text-stone-400 mt-1">
                      Generate at{" "}
                      <a
                        href="https://lichess.org/account/oauth/token"
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-stone-600"
                      >
                        lichess.org/account/oauth/token
                      </a>
                    </p>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleConnect}
                  disabled={!username.trim() || loading}
                  className="w-full"
                  size="lg"
                >
                  Connect account
                </Button>

                <button
                  onClick={() => { setStep("platform"); setPlatform(null); setError(""); }}
                  className="w-full text-sm text-stone-400 hover:text-stone-600 transition-colors text-center"
                >
                  Choose a different platform
                </button>
              </div>
            )}
          </>
        )}

        {/* Connecting */}
        {step === "connecting" && (
          <div className="py-8 text-center">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
            <h2 className="font-bold text-stone-900 text-lg mb-1">Connecting to {platform}…</h2>
            <p className="text-stone-500 text-sm">Verifying your username</p>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="font-bold text-stone-900 text-lg mb-1">Connected!</h2>
            <p className="text-stone-500 text-sm">Redirecting to your dashboard…</p>
          </div>
        )}
      </Card>

      <p className="mt-6 text-xs text-stone-400 text-center max-w-sm">
        We only read your public game data. We never ask for your password.
      </p>
    </div>
  );
}
