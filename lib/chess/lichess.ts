import type { Game, GamePlayer, PlayerResult } from '../../types/index.js';

const BASE_URL = 'https://lichess.org/api';

// ---- Raw API shapes --------------------------------------------------------

interface LichessUser {
  name: string;
  id: string;
}

interface LichessPlayer {
  user?: LichessUser;
  rating: number;
  ratingDiff?: number;
}

interface LichessClock {
  initial: number;    // seconds
  increment: number;  // seconds
}

interface LichessGame {
  id: string;
  rated: boolean;
  speed: string;      // 'ultraBullet' | 'bullet' | 'blitz' | 'rapid' | 'classical' | 'correspondence'
  createdAt: number;  // ms timestamp
  lastMoveAt: number; // ms timestamp
  status: string;     // 'mate' | 'resign' | 'outoftime' | 'draw' | 'stalemate' | ...
  winner?: 'white' | 'black';
  players: { white: LichessPlayer; black: LichessPlayer };
  pgn?: string;
  lastFen?: string;
  opening?: { eco: string; name: string };
  clock?: LichessClock;
}

// ---- Helpers ---------------------------------------------------------------

function mapSpeed(speed: string): string {
  if (speed === 'ultraBullet') return 'bullet';
  if (speed === 'classical') return 'rapid';
  if (speed === 'correspondence') return 'daily';
  return speed;
}

function mapTimeControl(clock: LichessClock | undefined, speed: string): string {
  if (!clock) return speed === 'correspondence' ? 'correspondence' : 'unlimited';
  return `${clock.initial}+${clock.increment}`;
}

/**
 * Derive each player's result from the game status and winner field.
 * Lichess reports a winner (or none for draws) and a status describing
 * how the game ended, rather than per-player result strings.
 */
function mapResults(
  status: string,
  winner: 'white' | 'black' | undefined,
): [white: PlayerResult, black: PlayerResult] {
  // Draw-type statuses — no winner
  const drawStatus: Record<string, PlayerResult> = {
    draw: 'agreed',
    stalemate: 'stalemate',
    repetition: 'repetition',
    insufficient: 'insufficient',
    fiftyMove: '50move',
    aborted: 'abandoned',
    noStart: 'abandoned',
  };

  if (status in drawStatus) {
    const r = drawStatus[status] as PlayerResult;
    return [r, r];
  }

  // Decisive statuses — one winner, one loser
  const loserResult: Record<string, PlayerResult> = {
    mate: 'checkmated',
    resign: 'resigned',
    outoftime: 'timeout',
    timeout: 'timeout',
    cheat: 'abandoned',
  };

  const loser = loserResult[status] ?? (status as PlayerResult);

  if (winner === 'white') return ['win', loser];
  if (winner === 'black') return [loser, 'win'];

  // Unknown status with no winner — pass status through
  return [status as PlayerResult, status as PlayerResult];
}

function toPlayer(raw: LichessPlayer, result: PlayerResult): GamePlayer {
  return {
    username: raw.user?.name ?? 'Anonymous',
    rating: raw.rating,
    result,
  };
}

function toGame(raw: LichessGame): Game {
  const [whiteResult, blackResult] = mapResults(raw.status, raw.winner);

  const game: Game = {
    source: 'lichess',
    url: `https://lichess.org/${raw.id}`,
    pgn: raw.pgn ?? '',
    timeClass: mapSpeed(raw.speed),
    timeControl: mapTimeControl(raw.clock, raw.speed),
    rated: raw.rated,
    startTime: new Date(raw.createdAt),
    endTime: new Date(raw.lastMoveAt),
    white: toPlayer(raw.players.white, whiteResult),
    black: toPlayer(raw.players.black, blackResult),
  };

  if (raw.lastFen !== undefined) {
    game.fen = raw.lastFen;
  }
  if (raw.opening?.eco !== undefined) {
    game.eco = raw.opening.eco;
  }

  return game;
}

// ---- Public API ------------------------------------------------------------

/**
 * Fetches the most recent `limit` games (default 50) for a Lichess user,
 * returned in chronological order (oldest first).
 *
 * Pass a Bearer `token` for higher rate limits and access to private games.
 * Without a token only public games are returned.
 */
export async function getRecentGames(
  username: string,
  limit = 50,
  token?: string,
): Promise<Game[]> {
  const params = new URLSearchParams({
    max: String(limit),
    pgnInJson: 'true',
    lastFen: 'true',
    opening: 'true',
  });

  const headers: HeadersInit = {
    Accept: 'application/x-ndjson',
  };
  if (token !== undefined) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(
    `${BASE_URL}/games/user/${encodeURIComponent(username)}?${params}`,
    { headers },
  );

  if (!res.ok) {
    throw new Error(`Lichess API error ${res.status} ${res.statusText}`);
  }

  // NDJSON: one JSON object per line, delivered newest-first.
  const text = await res.text();
  const games = text
    .split('\n')
    .filter((line: string) => line.trim() !== '')
    .map((line: string) => toGame(JSON.parse(line) as LichessGame));

  // Reverse so the array is chronological (oldest first), matching chess.com.
  return games.reverse();
}
