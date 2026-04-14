import { Stockfish } from '@se-oss/stockfish';
import type { StockfishLine } from '@se-oss/stockfish';

export { Stockfish };

export interface EvalResult {
  /** Best move in UCI notation e.g. "e2e4" */
  bestMoveUci: string;
  /**
   * Score in centipawns from white's perspective.
   * Positive = white advantage, negative = black advantage.
   * Mate scores are normalised to ±100_000.
   */
  score: number;
  /** Scores for each MultiPV line, same convention as `score` */
  lineScores: number[];
}

function normaliseScore(line: StockfishLine): number {
  if (line.score.type === 'mate') {
    // Positive mate value = white mates, negative = black mates
    return line.score.value > 0 ? 100_000 : -100_000;
  }
  return line.score.value;
}

export async function createEngine(): Promise<Stockfish> {
  const engine = new Stockfish();
  await engine.waitReady();
  return engine;
}

/**
 * Evaluate a position to the given depth.
 * Pass multiPV > 1 to get scores for alternative lines (used for
 * brilliant / great move detection).
 */
export async function evalPosition(
  engine: Stockfish,
  fen: string,
  depth: number,
  multiPV = 1,
): Promise<EvalResult> {
  const result = await engine.analyze(fen, depth, multiPV);

  const lineScores = result.lines.map(normaliseScore);
  const topScore = lineScores[0] ?? 0;

  return {
    bestMoveUci: result.bestmove,
    score: topScore,
    lineScores,
  };
}
