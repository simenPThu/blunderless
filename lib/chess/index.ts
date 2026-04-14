import { getRecentGames as getChessComGames } from './chesscom.js';
import { getRecentGames as getLichessGames } from './lichess.js';

export type { Game, GamePlayer, PlayerResult, TimeClass } from '../../types/index.js';

/**
 * Fetch the most recent `limit` games (default 50) for a user on either
 * chess.com or Lichess, returned in chronological order (oldest first).
 *
 * @param platform - Which platform to query
 * @param username - The player's username on that platform
 * @param limit    - Maximum number of games to return (default 50)
 * @param options  - Platform-specific options (e.g. Lichess API token)
 */
export async function getRecentGames(
  platform: 'chess.com' | 'lichess',
  username: string,
  limit = 50,
  options?: { token?: string },
) {
  if (platform === 'lichess') {
    return getLichessGames(username, limit, options?.token);
  }
  return getChessComGames(username, limit);
}
