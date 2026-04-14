import { Chess } from 'chess.js';
import type { ExplainedGame, Puzzle } from '../../types/index.js';

/**
 * Convert a SAN move string to UCI notation (e.g. "Nf3" → "g1f3").
 * Returns null if the move is illegal or the FEN is invalid.
 */
function sanToUci(fen: string, san: string): string | null {
  try {
    const chess = new Chess(fen);
    const move = chess.move(san);
    if (!move) return null;
    return move.from + move.to + (move.promotion ?? '');
  } catch {
    return null;
  }
}

/**
 * Estimate a rough puzzle difficulty rating from centipawn loss and the
 * player's own rating. This is an approximation — own-game puzzles don't
 * have Glicko ratings like Lichess puzzles do.
 */
function estimateRating(cpLoss: number, playerRating: number): number {
  // Bigger cp loss = the correct move was harder to see (more forcing / further ahead).
  if (cpLoss >= 500) return playerRating + 150;
  if (cpLoss >= 300) return playerRating + 50;
  return Math.max(400, playerRating - 100);
}

/**
 * Extract puzzle positions from a player's own analysed games.
 * Every move where the player blundered or made a mistake becomes a puzzle:
 * the solver is shown the position before the error and must find the best move.
 *
 * @param analyses  - Explained game analyses (output of explainGame()).
 * @param playerUsername - Used to determine which color the player was.
 * @param playerRating   - Used to estimate puzzle difficulty.
 * @param seenIds   - Optional set of puzzle IDs to exclude (already-solved).
 */
export function extractGamePuzzles(
  analyses: ExplainedGame[],
  playerUsername: string,
  playerRating: number,
  seenIds?: Set<string>,
): Puzzle[] {
  const puzzles: Puzzle[] = [];

  for (const analysis of analyses) {
    const playerColor =
      analysis.game.white.username.toLowerCase() === playerUsername.toLowerCase()
        ? 'white'
        : 'black';

    analysis.moves.forEach((move, moveIndex) => {
      if (move.classification !== 'blunder' && move.classification !== 'mistake') return;

      // Only include positions where the player (not the opponent) made the error.
      // Move index 0 = white's first move, 1 = black's first move, etc.
      const movedColor = moveIndex % 2 === 0 ? 'white' : 'black';
      if (movedColor !== playerColor) return;

      const id = `${analysis.game.url}#${moveIndex}`;
      if (seenIds?.has(id)) return;

      const uci = sanToUci(move.fenBefore, move.bestMoveSan);
      if (!uci) return; // skip if SAN conversion fails (shouldn't happen)

      puzzles.push({
        id,
        source: 'game',
        fen: move.fenBefore,
        solution: [uci],
        themes: move.explanation.concepts,
        rating: estimateRating(move.cpLoss, playerRating),
        gameUrl: analysis.game.url,
        blunderedMove: move.san,
      });
    });
  }

  // Shuffle so callers get variety across games rather than game-ordered output.
  for (let i = puzzles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = puzzles[i];
    const b = puzzles[j];
    if (a !== undefined && b !== undefined) {
      puzzles[i] = b;
      puzzles[j] = a;
    }
  }

  return puzzles;
}
