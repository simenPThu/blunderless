import type { Game, GamePlayer } from '../../types/index.js';

const BASE_URL = 'https://api.chess.com/pub';

// chess.com requires a descriptive User-Agent — requests without one may be blocked.
const HEADERS: HeadersInit = {
  'User-Agent': 'chess-coach/1.0',
};

// ---- Raw API shapes --------------------------------------------------------

interface RawPlayer {
  username: string;
  rating: number;
  result: string;
  '@id': string;
}

interface RawGame {
  url: string;
  pgn: string;
  fen: string;
  start_time: number;
  end_time: number;
  time_control: string;
  time_class: string;
  rated: boolean;
  white: RawPlayer;
  black: RawPlayer;
  accuracies?: { white: number; black: number };
  eco?: string;
}

interface ArchivesResponse {
  archives: string[];
}

interface MonthlyGamesResponse {
  games: RawGame[];
}

// ---- Helpers ---------------------------------------------------------------

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`chess.com API error ${res.status} ${res.statusText} — ${url}`);
  }
  return res.json() as Promise<T>;
}

function toPlayer(raw: RawPlayer): GamePlayer {
  return {
    username: raw.username,
    rating: raw.rating,
    result: raw.result,
  };
}

function toGame(raw: RawGame): Game {
  const game: Game = {
    source: 'chess.com',
    url: raw.url,
    pgn: raw.pgn,
    fen: raw.fen,
    timeClass: raw.time_class,
    timeControl: raw.time_control,
    rated: raw.rated,
    startTime: new Date(raw.start_time * 1000),
    endTime: new Date(raw.end_time * 1000),
    white: toPlayer(raw.white),
    black: toPlayer(raw.black),
  };

  if (raw.accuracies !== undefined) {
    game.accuracies = raw.accuracies;
  }
  if (raw.eco !== undefined) {
    game.eco = raw.eco;
  }

  return game;
}

// ---- Public API ------------------------------------------------------------

/**
 * Fetches the most recent `limit` games (default 50) for a chess.com user,
 * returned in chronological order (oldest first).
 *
 * Strategy: walk monthly archives newest-first, accumulating games until we
 * have at least `limit`, then slice off the tail.
 */
export async function getRecentGames(username: string, limit = 50): Promise<Game[]> {
  const { archives } = await fetchJson<ArchivesResponse>(
    `${BASE_URL}/player/${encodeURIComponent(username)}/games/archives`,
  );

  if (archives.length === 0) return [];

  // Collect games newest-archive-first into a prepend buffer so that the
  // final array stays in chronological (oldest-first) order.
  const collected: Game[] = [];

  for (let i = archives.length - 1; i >= 0 && collected.length < limit; i--) {
    const archiveUrl = archives[i];
    if (!archiveUrl) continue;

    const { games: monthGames } = await fetchJson<MonthlyGamesResponse>(archiveUrl);

    // Prepend this month's games (already chronological within the month)
    // so `collected` stays fully chronological as we walk backwards.
    collected.unshift(...monthGames.map(toGame));
  }

  // Return only the most recent `limit` games.
  return collected.slice(-limit);
}
