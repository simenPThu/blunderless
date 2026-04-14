import { Chess } from 'chess.js';

export interface TacticalContext {
  /** The move delivers check */
  givesCheck: boolean;
  /** The move delivers checkmate */
  isCheckmate: boolean;
  /** The move promotes a pawn */
  isPromotion: boolean;
  /** The move captures an opponent piece */
  isCapture: boolean;
  /** The move gives up more material than it takes and the piece is recapturable */
  isSacrifice: boolean;
  /**
   * Number of legal replies the opponent has after this move.
   * Low values indicate a forcing or space-restricting move.
   */
  opponentMovesAfter: number;
}

/**
 * Derive cheap, reliable tactical facts from the position after a move.
 * These are passed to the LLM as ground-truth context so it doesn't need
 * to infer them from the FEN alone.
 *
 * @param san        - The move in Standard Algebraic Notation (used to detect promotion).
 * @param fenAfter   - FEN of the resulting position.
 * @param isCapture  - Whether the move captured a piece (from PGN parser).
 * @param isSacrifice - Whether the move is a material sacrifice (from PGN parser).
 */
export function getTacticalContext(
  san: string,
  fenAfter: string,
  isCapture: boolean,
  isSacrifice: boolean,
): TacticalContext {
  const board = new Chess(fenAfter);

  return {
    givesCheck: board.inCheck(),
    isCheckmate: board.isCheckmate(),
    // SAN promotions always contain '=' e.g. 'e8=Q' or 'exd8=Q+'
    isPromotion: san.includes('='),
    isCapture,
    isSacrifice,
    opponentMovesAfter: board.moves().length,
  };
}
