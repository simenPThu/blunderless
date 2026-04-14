// Client-side account helpers (localStorage).
// Username and platform are public info — safe to store in localStorage.
// The Lichess token is stored in an httpOnly cookie set by /api/connect
// and is never accessible from JavaScript.

export interface Account {
  platform: "chess.com" | "lichess";
  username: string;
  rating?: number;
}

const KEY = "blunderless_account";

export function getAccount(): Account | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
}

export function setAccount(account: Account): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(account));
}

export function clearAccount(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
