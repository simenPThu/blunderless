import { Chess } from 'chess.js';
import type { Game, GameAnalysis, AnalyzedMove } from '../../types/index.js';
import { createEngine, evalPosition } from './engine.js';
import { classifyMove } from './classifier.js';
import { parsePgn } from './pgn.js';

export interface AnalysisOptions {
  /** Stockfish search depth per position. Default: 22. Higher = stronger but slower. */
  depth?: number;
}

const DEFAULT_DEPTH = 22;

// ---- Scoring helpers -------------------------------------------------------

/**
 * Centipawn loss for the move just played.
 * Both scores are from white's perspective (positive = white advantage).
 * Returns 0 for moves that match or exceed the engine's expectation.
 */
function computeCpLoss(
  scoreBefore: number,
  scoreAfter: number,
  color: 'w' | 'b',
): number {
  // White wants the score to stay high; black wants it to go low.
  const delta = scoreBefore - scoreAfter;
  const loss = color === 'w' ? delta : -delta;
  return Math.max(0, loss);
}

/**
 * How much better the best engine line is vs the 2nd-best line,
 * from the mover's perspective. Large value = only one strong move existed.
 */
function computeAltDelta(lineScores: number[], color: 'w' | 'b'): number {
  const first = lineScores[0];
  const second = lineScores[1];
  if (first === undefined || second === undefined) return 0;

  const sign = color === 'w' ? 1 : -1;
  return Math.max(0, (first - second) * sign);
}

/**
 * Map average centipawn loss to an accuracy percentage using chess.com's
 * exponential decay formula. Returns a value in [0, 100].
 */
function cpLossToAccuracy(cpLoss: number): number {
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * cpLoss) - 3.1669));
}

function computeAccuracy(
  moves: AnalyzedMove[],
): { white: number; black: number } {
  // Split moves by side (white plays on even indices 0,2,4…; black on odd 1,3,5…)
  const whiteLosses = moves
    .filter((_, i) => i % 2 === 0)
    .map((m) => m.cpLoss);
  const blackLosses = moves
    .filter((_, i) => i % 2 !== 0)
    .map((m) => m.cpLoss);

  const avg = (arr: number[]) =>
    arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;

  return {
    white: Math.round(cpLossToAccuracy(avg(whiteLosses)) * 10) / 10,
    black: Math.round(cpLossToAccuracy(avg(blackLosses)) * 10) / 10,
  };
}

// ---- UCI → SAN conversion --------------------------------------------------

function uciToSan(fen: string, uci: string): string {
  const chess = new Chess(fen);
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci[4];

  const moveObj = promotion !== undefined
    ? chess.move({ from, to, promotion })
    : chess.move({ from, to });

  return moveObj?.san ?? uci;
}

// ---- Public API ------------------------------------------------------------

/**
 * Analyse every move in a game with Stockfish and classify each one.
 *
 * @param game    - A `Game` object with a valid PGN string.
 * @param options - Optional depth override (default 22).
 * @returns       - `GameAnalysis` with per-move classifications and overall accuracy.
 */
export async function analyzeGame(
  game: Game,
  options?: AnalysisOptions,
): Promise<GameAnalysis> {
  const depth = options?.depth ?? DEFAULT_DEPTH;
  const positions = parsePgn(game.pgn);

  if (positions.length === 0) {
    return { game, moves: [], accuracy: { white: 100, black: 100 } };
  }

  const engine = await createEngine();
  const analyzedMoves: AnalyzedMove[] = [];

  try {
    for (const pos of positions) {
      // Evaluate the position BEFORE the move with MultiPV=3 so we can
      // detect how many strong alternatives existed (needed for brilliant/great).
      const evalBefore = await evalPosition(engine, pos.fenBefore, depth, 3);

      // Evaluate the position AFTER the move with MultiPV=1 (we only need
      // the resulting score to compute centipawn loss).
      const evalAfter = await evalPosition(engine, pos.fenAfter, depth, 1);

      const cpLoss = computeCpLoss(evalBefore.score, evalAfter.score, pos.color);
      const isBestMove = pos.uci === evalBefore.bestMoveUci;
      const altDelta = computeAltDelta(evalBefore.lineScores, pos.color);

      const classification = classifyMove(
        cpLoss,
        isBestMove,
        pos.isSacrifice,
        altDelta,
      );

      analyzedMoves.push({
        san: pos.san,
        fenBefore: pos.fenBefore,
        fen: pos.fenAfter,
        classification,
        cpLoss,
        bestMoveSan: isBestMove ? pos.san : uciToSan(pos.fenBefore, evalBefore.bestMoveUci),
        evalAfter: evalAfter.score,
      });
    }
  } finally {
    // Always shut the engine down, even if analysis throws mid-game.
    engine.terminate();
  }

  return {
    game,
    moves: analyzedMoves,
    accuracy: computeAccuracy(analyzedMoves),
  };
}
