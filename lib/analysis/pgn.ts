import { Chess } from 'chess.js';
import type { PieceSymbol, Color, Square } from 'chess.js';

// Standard piece values in pawns (used for sacrifice detection).
const PIECE_VALUE: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export interface PositionInfo {
  /** FEN before this move — used to evaluate the position */
  fenBefore: string;
  /** FEN after this move — used to evaluate the resulting position */
  fenAfter: string;
  /** Move in Standard Algebraic Notation e.g. "Nf3" */
  san: string;
  /** Move in UCI notation e.g. "g1f3" — used to compare with engine bestmove */
  uci: string;
  /** Side that played this move */
  color: Color;
  /** Whether the move captured an opponent piece */
  isCapture: boolean;
  /**
   * Whether the move is a material sacrifice:
   * the moved piece is worth more than what was captured AND
   * the moved piece is immediately recapturable on the destination square.
   */
  isSacrifice: boolean;
}

/**
 * Replay a PGN string move-by-move and return per-move context.
 * Throws if the PGN cannot be parsed.
 */
export function parsePgn(pgn: string): PositionInfo[] {
  const chess = new Chess();
  chess.loadPgn(pgn);

  // history({ verbose: true }) returns moves with before/after FEN,
  // piece, captured, flags, san, color, from, to, promotion.
  const history = chess.history({ verbose: true });

  return history.map((move) => {
    const promotion = move.promotion;
    const uci = move.from + move.to + (promotion !== undefined ? promotion : '');
    const isCapture = move.captured !== undefined;

    let isSacrifice = false;

    if (isCapture && move.captured !== undefined) {
      const movedValue = PIECE_VALUE[move.piece];
      const capturedValue = PIECE_VALUE[move.captured];

      // A sacrifice: we move a more-valuable piece onto a square where
      // it can immediately be recaptured.
      if (movedValue > capturedValue) {
        const board = new Chess(move.after);
        const opponentColor: Color = move.color === 'w' ? 'b' : 'w';
        const attackers = board.attackers(move.to as Square, opponentColor);
        isSacrifice = attackers.length > 0;
      }
    }

    return {
      fenBefore: move.before,
      fenAfter: move.after,
      san: move.san,
      uci,
      color: move.color,
      isCapture,
      isSacrifice,
    };
  });
}
