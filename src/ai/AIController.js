import { generateAllMoves } from './MoveGenerator';
import { selectMove } from './AIEvaluator';

/**
 * Main AI Controller - coordinates move generation and selection
 */

/**
 * Generate an AI move for the current player
 * @param {Array} board - Current board state
 * @param {number} playerId - Current player ID (color ID)
 * @param {Object} usedPieces - Used pieces tracker
 * @param {boolean} isFirstMove - Is this the first move
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} playerCount - Number of players (2, 3, or 4)
 * @param {Array} allyColors - Array of color IDs controlled by the same player
 * @param {Array} opponentColors - Array of color IDs controlled by opponents
 * @returns {Object|null} Selected move or null if no valid moves
 */
export function generateAIMove(board, playerId, usedPieces, isFirstMove, difficulty = 'medium', playerCount = 4, allyColors = null, opponentColors = null) {
  // Generate all possible legal moves
  const allMoves = generateAllMoves(board, playerId, usedPieces, isFirstMove);

  // If no valid moves, return null
  if (!allMoves || allMoves.length === 0) {
    return null;
  }

  // Select best move based on difficulty
  const selectedMove = selectMove(allMoves, board, playerId, difficulty, usedPieces, isFirstMove, playerCount, allyColors, opponentColors);

  return selectedMove;
}

/**
 * Get thinking time based on difficulty (for realistic AI behavior)
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {number} Delay in milliseconds
 */
export function getAIThinkingTime(difficulty) {
  switch (difficulty) {
    case 'easy':
      return 600 + Math.random() * 800; // 600-1400ms (smoother)
    case 'medium':
      return 1200 + Math.random() * 1000; // 1200-2200ms (more thoughtful)
    case 'hard':
      return 2000 + Math.random() * 1500; // 2000-3500ms (strategic pause)
    default:
      return 800 + Math.random() * 700;
  }
}
