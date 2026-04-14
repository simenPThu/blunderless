import { Chess } from 'chess.js';
import type { Puzzle } from '../../types/index.js';

const BASE_URL = 'https://lichess.org/api';

// ---- Raw Lichess types -----------------------------------------------------

interface LichessGame {
  id: string;
  pgn: string;
}

interface LichessPuzzleData {
  id: string;
  initialPly: number;
  rating: number;
  plays: number;
  solution: string[];
  themes: string[];
}

interface LichessBatchItem {
  game: LichessGame;
  puzzle: LichessPuzzleData;
}

interface LichessBatchResponse {
  puzzles: LichessBatchItem[];
}

// ---- FEN reconstruction ----------------------------------------------------

/**
 * Replay a PGN up to `ply` half-moves and return the resulting FEN.
 * Used because the Lichess batch API does not include FEN directly.
 */
function fenAtPly(pgn: string, ply: number): string {
  const source = new Chess();
  source.loadPgn(pgn);
  const moves = source.history(); // SAN array, full game

  const board = new Chess();
  const limit = Math.min(ply, moves.length);
  for (let i = 0; i < limit; i++) {
    board.move(moves[i]!);
  }
  return board.fen();
}

// ---- Mapping ---------------------------------------------------------------

function toOurPuzzle(item: LichessBatchItem): Puzzle {
  const fen = fenAtPly(item.game.pgn, item.puzzle.initialPly);

  const puzzle: Puzzle = {
    id: item.puzzle.id,
    source: 'lichess',
    fen,
    solution: item.puzzle.solution,
    themes: item.puzzle.themes,
    rating: item.puzzle.rating,
    gameUrl: `https://lichess.org/${item.game.id}`,
  };

  return puzzle;
}

// ---- Public API ------------------------------------------------------------

/**
 * Fetch puzzles from Lichess filtered to the given themes.
 * Over-fetches by 2× to leave room for seenIds deduplication.
 *
 * @param themes  - Lichess theme names e.g. ['fork', 'pin', 'skewer']
 * @param count   - Number of puzzles to return after filtering
 * @param options - Optional auth token and seen-ID set
 */
export async function fetchLichessPuzzles(
  themes: string[],
  count: number,
  options?: { token?: string; seenIds?: Set<string> },
): Promise<Puzzle[]> {
  if (themes.length === 0 || count === 0) return [];

  const params = new URLSearchParams({
    nb: String(count * 2), // over-fetch to absorb seenIds filtering
    themes: JSON.stringify(themes),
    themesType: 'ONE',
  });

  const headers: HeadersInit = { Accept: 'application/json' };
  if (options?.token !== undefined) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${BASE_URL}/puzzle/batch?${params}`, { headers });
  if (!res.ok) {
    throw new Error(`Lichess puzzle API error ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as LichessBatchResponse;
  const seenIds = options?.seenIds;

  return body.puzzles
    .filter((item) => !seenIds?.has(item.puzzle.id))
    .slice(0, count)
    .map(toOurPuzzle);
}
