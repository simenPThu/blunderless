// ---- Platform types --------------------------------------------------------

// Result strings returned by chess.com for each player in a game.
// The `& {}` on the fallback preserves autocomplete for the known values
// while still accepting any future result strings the API may add.
export type PlayerResult =
  | 'win'
  | 'checkmated'
  | 'timeout'
  | 'resigned'
  | 'stalemate'
  | 'insufficient'
  | 'repetition'
  | 'agreed'
  | 'timevsinsufficient'
  | '50move'
  | 'abandoned'
  | 'dailytimeout'
  | (string & {});

export type TimeClass = 'bullet' | 'blitz' | 'rapid' | 'daily' | (string & {});

export interface GamePlayer {
  username: string;
  rating: number;
  result: PlayerResult;
}

export interface Game {
  /** Platform the game was fetched from */
  source: 'chess.com' | 'lichess';
  /** Canonical game URL */
  url: string;
  /** Full PGN string */
  pgn: string;
  /** Final position FEN — may be absent for aborted/correspondence games */
  fen?: string;
  /** e.g. "bullet" | "blitz" | "rapid" | "daily" */
  timeClass: TimeClass;
  /** Raw time-control string, e.g. "600" or "180+2" */
  timeControl: string;
  rated: boolean;
  startTime: Date;
  endTime: Date;
  white: GamePlayer;
  black: GamePlayer;
  /** Move accuracies, present only when chess.com computed them */
  accuracies?: { white: number; black: number };
  /** ECO opening URL, when available */
  eco?: string;
}

// ---- Move analysis ---------------------------------------------------------

export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder';

export interface AnalyzedMove {
  /** SAN notation e.g. "Nf3" */
  san: string;
  /** FEN of the position before this move — needed for explanation context */
  fenBefore: string;
  /** FEN of the position after this move */
  fen: string;
  classification: MoveClassification;
  /** Centipawn loss vs the engine's best move (≥ 0; 0 = best move played) */
  cpLoss: number;
  /** Engine's top choice in SAN — equals san when the best move was played */
  bestMoveSan: string;
  /** Position eval after this move, centipawns from white's perspective */
  evalAfter: number;
}

export interface GameAnalysis {
  game: Game;
  moves: AnalyzedMove[];
  /** Overall accuracy 0–100 per side (exponential decay of avg cp loss) */
  accuracy: { white: number; black: number };
}

// ---- AI explanations -------------------------------------------------------

export interface MoveExplanation {
  /** 2-3 sentence coaching explanation, vocabulary adapted to player rating */
  summary: string;
  /** Chess concepts the move illustrates e.g. ['fork', 'king safety', 'tempo'] */
  concepts: string[];
  /** For blunder/mistake/inaccuracy: why the best move was better */
  suggestion?: string;
}

export interface ExplainedMove extends AnalyzedMove {
  explanation: MoveExplanation;
}

export interface ExplainedGame extends GameAnalysis {
  moves: ExplainedMove[];
}

// ---- Puzzles ---------------------------------------------------------------

export interface Puzzle {
  /** Lichess puzzle ID, or "{gameUrl}#{moveIndex}" for own-game puzzles */
  id: string;
  source: 'lichess' | 'game';
  /** FEN of the position the solver must find the best move from */
  fen: string;
  /** Full solution in UCI notation e.g. ['e2e4', 'e7e5', 'd2d4'] */
  solution: string[];
  /** Themes this puzzle trains e.g. ['fork', 'pin'] */
  themes: string[];
  /** Puzzle difficulty rating */
  rating: number;
  /** Link back to the original game */
  gameUrl?: string;
  /** For own-game puzzles: the move the player actually played */
  blunderedMove?: string;
}

export interface ThemeFrequency {
  /** Lichess-compatible theme name */
  theme: string;
  /** Number of blunders/mistakes that matched this theme */
  count: number;
}

export interface PuzzleSet {
  puzzles: Puzzle[];
  /** Weakness themes that drove selection, sorted by frequency */
  targetedThemes: ThemeFrequency[];
}
