import Anthropic from '@anthropic-ai/sdk';
import type {
  AnalyzedMove,
  ExplainedMove,
  ExplainedGame,
  GameAnalysis,
  MoveExplanation,
} from '../../types/index.js';
import { getTacticalContext } from './tactics.js';
import { parsePgn } from './pgn.js';

// ---- Types -----------------------------------------------------------------

export interface ExplainOptions {
  /** The username of the player being coached — determines which color is "you" */
  playerUsername: string;
  /** Player's rating (0–3000). Calibrates vocabulary and depth of explanation. */
  playerRating: number;
  /** Anthropic API key */
  apiKey: string;
  /** Max concurrent Claude calls. Default: 5 */
  concurrency?: number;
}

// ---- Tool schema for structured output ------------------------------------

const EXPLAIN_TOOL: Anthropic.Tool = {
  name: 'explain_move',
  description: 'Provide a chess coaching explanation for a single move.',
  input_schema: {
    type: 'object',
    required: ['summary', 'concepts'],
    properties: {
      summary: {
        type: 'string',
        description:
          '2-3 sentence explanation of why the move is good or bad, adapted to the player rating.',
      },
      concepts: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Chess concepts illustrated by this move, e.g. ["fork", "king safety", "tempo"]. 1-4 items.',
      },
      suggestion: {
        type: 'string',
        description:
          'For blunder/mistake/inaccuracy only: explain what the best move achieves and why it is better.',
      },
    },
  },
};

// ---- Rating label ----------------------------------------------------------

function ratingLabel(rating: number): string {
  if (rating < 800) return 'complete beginner (under 800)';
  if (rating < 1200) return 'beginner (800–1199)';
  if (rating < 1600) return 'club player (1200–1599)';
  if (rating < 2000) return 'intermediate (1600–1999)';
  if (rating < 2400) return 'advanced (2000–2399)';
  return 'master-level (2400+)';
}

// ---- Prompt builder --------------------------------------------------------

function buildPrompt(
  move: AnalyzedMove,
  playerColor: 'white' | 'black',
  playerRating: number,
): string {
  const isPlayerMove = move.san === move.san; // always true — every move is explained
  const color = playerColor === 'white'
    ? (move.fen.split(' ')[1] === 'b' ? 'White' : 'Black') // color who just moved
    : (move.fen.split(' ')[1] === 'w' ? 'Black' : 'White');

  // Derive the color that just moved from fenBefore (it's the side that was to move)
  const movedColor = move.fenBefore.split(' ')[1] === 'w' ? 'White' : 'Black';
  const isPlayerColor = movedColor.toLowerCase() === playerColor;

  const lines: string[] = [
    `Position before move (FEN): ${move.fenBefore}`,
    `Move played: ${move.san} (${movedColor} to move)`,
    `This move belongs to: ${isPlayerColor ? 'the player being coached' : 'the opponent'}`,
    `Classification: ${move.classification}${move.cpLoss > 0 ? ` — centipawn loss: ${move.cpLoss}` : ''}`,
  ];

  if (move.bestMoveSan !== move.san) {
    lines.push(`Engine's best move: ${move.bestMoveSan}`);
  }

  // Tactical context — derived from fenAfter
  const tc = getTacticalContext(move.san, move.fen, false, false);
  lines.push('');
  lines.push('Tactical facts (verified):');
  if (tc.isCheckmate) lines.push('- This move delivers checkmate');
  else if (tc.givesCheck) lines.push('- This move gives check');
  if (tc.isPromotion) lines.push('- This move promotes a pawn');
  lines.push(`- Opponent has ${tc.opponentMovesAfter} legal replies after this move`);

  lines.push('');
  lines.push(`Player being coached: rated ${playerRating} (${ratingLabel(playerRating)})`);
  lines.push(
    `Adapt your explanation complexity and vocabulary to a ${ratingLabel(playerRating)} player.`,
  );

  if (['blunder', 'mistake', 'inaccuracy'].includes(move.classification)) {
    lines.push(
      `Include a "suggestion" field explaining what ${move.bestMoveSan} achieves and why it is better.`,
    );
  }

  return lines.join('\n');
}

// ---- Single-move explainer -------------------------------------------------

/**
 * Generate a coaching explanation for one move using Claude.
 */
export async function explainMove(
  move: AnalyzedMove,
  playerColor: 'white' | 'black',
  options: { playerRating: number; apiKey: string },
): Promise<ExplainedMove> {
  const client = new Anthropic({ apiKey: options.apiKey });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system:
      'You are an expert chess coach. Explain chess moves to students in an educational, ' +
      'encouraging way. Always identify the chess concept(s) at play. Adapt vocabulary ' +
      'and complexity to the player rating provided.',
    tools: [EXPLAIN_TOOL],
    tool_choice: { type: 'any' },
    messages: [
      {
        role: 'user',
        content: buildPrompt(move, playerColor, options.playerRating),
      },
    ],
  });

  // Extract the tool call result
  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return a tool call for move explanation');
  }

  const input = toolUse.input as {
    summary: string;
    concepts: string[];
    suggestion?: string;
  };

  const explanation: MoveExplanation = {
    summary: input.summary,
    concepts: input.concepts,
  };
  if (input.suggestion !== undefined) {
    explanation.suggestion = input.suggestion;
  }

  return { ...move, explanation };
}

// ---- Full-game explainer ---------------------------------------------------

/**
 * Generate coaching explanations for every move in an analysed game.
 * Moves are processed in parallel batches to balance speed and rate limits.
 */
export async function explainGame(
  analysis: GameAnalysis,
  options: ExplainOptions,
): Promise<ExplainedGame> {
  const { playerUsername, playerRating, apiKey, concurrency = 5 } = options;

  // Determine which color the coached player was
  const playerColor: 'white' | 'black' =
    analysis.game.white.username.toLowerCase() === playerUsername.toLowerCase()
      ? 'white'
      : 'black';

  const moveOptions = { playerRating, apiKey };

  // Process in batches of `concurrency`
  const explained: ExplainedMove[] = [];
  for (let i = 0; i < analysis.moves.length; i += concurrency) {
    const batch = analysis.moves.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((move) => explainMove(move, playerColor, moveOptions)),
    );
    explained.push(...results);
  }

  return {
    ...analysis,
    moves: explained,
  };
}
