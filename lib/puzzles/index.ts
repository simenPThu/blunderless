import type { ExplainedGame, Puzzle, PuzzleSet } from '../../types/index.js';
import { analyzeBlunderPatterns } from './patterns.js';
import { extractGamePuzzles } from './extractor.js';
import { fetchLichessPuzzles } from './lichess.js';

export { analyzeBlunderPatterns } from './patterns.js';
export { extractGamePuzzles } from './extractor.js';
export { fetchLichessPuzzles } from './lichess.js';

export interface PuzzleSetOptions {
  /** Total number of puzzles to return. Default: 10 */
  count?: number;
  /** The username of the player being coached */
  playerUsername: string;
  /** Player's current rating — used to estimate own-game puzzle difficulty */
  playerRating: number;
  /** Puzzle IDs the player has already seen — excluded from results */
  seenIds?: Set<string>;
  /** Optional Lichess OAuth token for higher rate limits */
  lichessToken?: string;
  /**
   * Fraction of puzzles to source from the player's own games (0–1).
   * The remainder comes from Lichess. Default: 0.3
   */
  ownGameRatio?: number;
}

/** Fisher-Yates shuffle (in-place, returns the array) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = arr[i];
    const b = arr[j];
    if (a !== undefined && b !== undefined) {
      arr[i] = b;
      arr[j] = a;
    }
  }
  return arr;
}

/**
 * Build a personalised puzzle set for a player based on their analysed games.
 *
 * The set is a mix of:
 *   - Positions from the player's own games where they blundered/made a mistake
 *   - Lichess puzzles filtered to the themes the player struggles with most
 *
 * @param analyses - Output of explainGame() for one or more of the player's games.
 * @param options  - Size, player info, seen-IDs, and source preferences.
 */
export async function getPuzzleSet(
  analyses: ExplainedGame[],
  options: PuzzleSetOptions,
): Promise<PuzzleSet> {
  const {
    count = 10,
    playerUsername,
    playerRating,
    seenIds,
    lichessToken,
    ownGameRatio = 0.3,
  } = options;

  // 1. Identify the player's top weakness themes across all blunders.
  const targetedThemes = analyzeBlunderPatterns(analyses);

  // 2. Extract positions from the player's own games.
  const ownGamePuzzles = extractGamePuzzles(
    analyses,
    playerUsername,
    playerRating,
    seenIds,
  );

  // 3. Decide the split.
  const ownCount = Math.min(Math.floor(count * ownGameRatio), ownGamePuzzles.length);
  const lichessCount = count - ownCount;

  // 4. Fetch Lichess puzzles on the top 5 weak themes.
  const topThemes = targetedThemes.slice(0, 5).map((t) => t.theme);

  let lichessPuzzles: Puzzle[] = [];
  if (lichessCount > 0 && topThemes.length > 0) {
    try {
      const lichessOpts: { token?: string; seenIds?: Set<string> } = {};
      if (lichessToken !== undefined) lichessOpts.token = lichessToken;
      if (seenIds !== undefined) lichessOpts.seenIds = seenIds;
      lichessPuzzles = await fetchLichessPuzzles(topThemes, lichessCount, lichessOpts);
    } catch (err) {
      // Lichess fetch failed — fall back to more own-game puzzles if available.
      const fallback = ownGamePuzzles.slice(ownCount, ownCount + lichessCount);
      lichessPuzzles = fallback;
    }
  }

  // 5. Combine and shuffle.
  const picked = shuffle([
    ...ownGamePuzzles.slice(0, ownCount),
    ...lichessPuzzles,
  ]);

  return { puzzles: picked, targetedThemes };
}
