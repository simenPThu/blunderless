import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type MoveClassification =
  | "brilliant"
  | "great"
  | "best"
  | "excellent"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export const classificationMeta: Record<
  MoveClassification,
  { label: string; symbol: string; color: string; bg: string }
> = {
  brilliant: { label: "Brilliant", symbol: "!!", color: "text-cyan-500", bg: "bg-cyan-50 border-cyan-200" },
  great:     { label: "Great",     symbol: "!",  color: "text-violet-500", bg: "bg-violet-50 border-violet-200" },
  best:      { label: "Best",      symbol: "✓",  color: "text-green-600", bg: "bg-green-50 border-green-200" },
  excellent: { label: "Excellent", symbol: "★",  color: "text-lime-600", bg: "bg-lime-50 border-lime-200" },
  good:      { label: "Good",      symbol: "·",  color: "text-stone-400", bg: "bg-stone-50 border-stone-200" },
  inaccuracy:{ label: "Inaccuracy","symbol": "?!", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  mistake:   { label: "Mistake",   symbol: "?",  color: "text-orange-500", bg: "bg-orange-50 border-orange-200" },
  blunder:   { label: "Blunder",   symbol: "??", color: "text-red-500", bg: "bg-red-50 border-red-200" },
};
