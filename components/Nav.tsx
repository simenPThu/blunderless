"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Brain, Puzzle, Home, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", icon: Home,     label: "Dashboard" },
  { href: "/analysis",  icon: BarChart2, label: "Analysis"  },
  { href: "/puzzles",   icon: Puzzle,    label: "Puzzles"   },
  { href: "/progress",  icon: Brain,     label: "Progress"  },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-stone-200 bg-white min-h-screen py-6 px-3 gap-1">
      <Link href="/" className="flex items-center gap-2 px-3 mb-6">
        <span className="text-2xl">♞</span>
        <span className="font-bold text-stone-900 tracking-tight text-lg">BlunderLess</span>
      </Link>
      {links.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            path.startsWith(href)
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </aside>
  );
}

export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 flex z-50">
      {links.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
            path.startsWith(href) ? "text-amber-600" : "text-stone-400"
          )}
        >
          <Icon className="w-5 h-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-stone-500 mb-6">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-stone-900 transition-colors">{item.label}</Link>
          ) : (
            <span className="text-stone-900 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
