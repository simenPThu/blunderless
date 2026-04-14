import type { MoveClassification } from '../../types/index.js';

/**
 * Classify a move based on centipawn loss and positional context.
 *
 * @param cpLoss       - How many centipawns worse than the best move (≥ 0).
 * @param isBestMove   - Whether the played move matches the engine's top choice.
 * @param isSacrifice  - Whether the move gives up more material than it takes.
 * @param altDelta     - Cp gap between the best and 2nd-best engine line
 *                       (from the mover's perspective). Large = only one good move existed.
 */
export function classifyMove(
  cpLoss: number,
  isBestMove: boolean,
  isSacrifice: boolean,
  altDelta: number,
): MoveClassification {
  // Brilliant: best move that sacrifices material in a position where most
  // alternatives are significantly worse (hard to find, engine-confirmed correct).
  if (cpLoss <= 5 && isBestMove && isSacrifice && altDelta >= 150) return 'brilliant';

  // Great: best move in a position with only one strong continuation.
  if (cpLoss <= 5 && isBestMove && altDelta >= 100) return 'great';

  if (cpLoss <= 5) return 'best';
  if (cpLoss <= 10) return 'excellent';
  if (cpLoss <= 25) return 'good';
  if (cpLoss <= 100) return 'inaccuracy';
  if (cpLoss <= 300) return 'mistake';
  return 'blunder';
}
