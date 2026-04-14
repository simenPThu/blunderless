import type { ExplainedGame, ThemeFrequency } from '../../types/index.js';

// Maps the free-text concept labels Claude returns to Lichess puzzle theme names.
// Matching is case-insensitive substring; extend freely.
const CONCEPT_TO_THEME: [pattern: RegExp, theme: string][] = [
  [/fork/i, 'fork'],
  [/pin/i, 'pin'],
  [/skewer/i, 'skewer'],
  [/sacrifice|sacri/i, 'sacrifice'],
  [/discovered\s*attack|discovery/i, 'discoveredAttack'],
  [/back\s*rank/i, 'backRankMate'],
  [/hanging\s*piece|undefended/i, 'hangingPiece'],
  [/king\s*safety|exposed\s*king/i, 'exposedKing'],
  [/promot/i, 'promotion'],
  [/deflect/i, 'deflection'],
  [/intermezzo|zwischenzug/i, 'intermezzo'],
  [/overload/i, 'hangingPiece'],
  [/trapped\s*piece/i, 'trappedPiece'],
  [/x.?ray/i, 'xRayAttack'],
  [/double\s*check/i, 'doubleCheck'],
  [/smothered/i, 'smotheredMate'],
  [/attraction|lure/i, 'attraction'],
  [/clearance/i, 'clearance'],
  [/interference/i, 'interference'],
  [/zugzwang/i, 'zugzwang'],
  [/endgame/i, 'endgame'],
  [/pawn\s*structure|pawn/i, 'pawnEndgame'],
];

function conceptToTheme(concept: string): string | null {
  for (const [pattern, theme] of CONCEPT_TO_THEME) {
    if (pattern.test(concept)) return theme;
  }
  // Pass through unknown concepts — Lichess ignores ones it doesn't recognise.
  // Normalise to camelCase-ish by stripping spaces.
  return concept.trim().length > 0 ? concept.trim().replace(/\s+/g, '_') : null;
}

/**
 * Scan all blunders and mistakes across a set of explained games and tally
 * how often each chess concept appears. Returns themes sorted by frequency
 * (most common weakness first).
 *
 * Only moves classified as 'blunder' or 'mistake' are counted — we want to
 * target what the player *gets wrong*, not what they do well.
 */
export function analyzeBlunderPatterns(
  analyses: ExplainedGame[],
): ThemeFrequency[] {
  const counts = new Map<string, number>();

  for (const analysis of analyses) {
    for (const move of analysis.moves) {
      if (move.classification !== 'blunder' && move.classification !== 'mistake') {
        continue;
      }

      for (const concept of move.explanation.concepts) {
        const theme = conceptToTheme(concept);
        if (theme === null) continue;
        counts.set(theme, (counts.get(theme) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count);
}
