import { cn } from "@/lib/utils";
import { type MoveClassification, classificationMeta } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-white rounded-xl border border-stone-200 shadow-xs", className)}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "amber" | "green" | "red" | "stone";
  className?: string;
}) {
  const variants = {
    default: "bg-stone-100 text-stone-700",
    amber:   "bg-amber-100 text-amber-700",
    green:   "bg-green-100 text-green-700",
    red:     "bg-red-100 text-red-600",
    stone:   "bg-stone-100 text-stone-500",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    primary:   "bg-amber-500 hover:bg-amber-600 text-white shadow-xs",
    secondary: "bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-xs",
    ghost:     "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
    danger:    "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-5 py-3 text-base rounded-xl font-semibold",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ClassificationBadge({ c }: { c: MoveClassification }) {
  const meta = classificationMeta[c];
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold border", meta.bg, meta.color)}>
      <span>{meta.symbol}</span>
      <span>{meta.label}</span>
    </span>
  );
}

export function AccuracyRing({ value, size = 80 }: { value: number; size?: number }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = value >= 85 ? "#22c55e" : value >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e7e5e4" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        className="rotate-90" style={{ transform: `rotate(90deg)`, transformOrigin: "50% 50%", fill: "#1c1917", fontSize: size * 0.22, fontWeight: 700 }}>
        {value}%
      </text>
    </svg>
  );
}

export function StatCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-stone-900">{value}</p>
      {sub && <p className="text-sm text-stone-400 mt-0.5">{sub}</p>}
      {trend && (
        <p className={cn("text-sm font-medium mt-1", trend.positive ? "text-green-600" : "text-red-500")}>
          {trend.positive ? "↑" : "↓"} {trend.value}
        </p>
      )}
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-stone-100", className)} />;
}
