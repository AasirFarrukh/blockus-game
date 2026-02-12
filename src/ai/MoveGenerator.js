import { PIECE_SHAPES } from '../data/pieces';
import { isValidPlacement } from '../utils/validation';
import { rotatePiece, flipPiece } from '../utils/gameLogic';

/**
 * Generate all legal moves for a given player
 * @param {Array} board - Current board state
 * @param {number} playerId - Player color ID (0-3)
 * @param {Object} usedPieces - Object tracking used pieces per player
 * @param {boolean} isFirstMove - Whether this is the player's first move
 * @returns {Array} Array of move objects {pieceId, row, col, shape, rotation, flip, pieceSize}
 */
export function generateAllMoves(board, playerId, usedPieces, isFirstMove) {
  const moves = [];

  // Get available pieces for this player
  const availablePieces = Object.keys(PIECE_SHAPES).filter(
    pieceId => !usedPieces[playerId].includes(pieceId)
  );

  if (availablePieces.length === 0) return moves;

  // For each available piece
  for (const pieceId of availablePieces) {
    const baseShape = PIECE_SHAPES[pieceId];
    const pieceSize = baseShape.flat().filter(cell => cell === 1).length;

    // Try all transformations (rotations and flips)
    const transformations = getAllTransformations(baseShape);

    for (const transformation of transformations) {
      const { shape, rotation, flip } = transformation;

      // Try all positions on the board
      // Extended range to allow pieces to extend partially off board edges
      for (let row = -4; row < 24; row++) {
        for (let col = -4; col < 24; col++) {
          const validation = isValidPlacement(
            board,
            row,
            col,
            shape,
            playerId,
            isFirstMove
          );

          if (validation.valid) {
            moves.push({
              pieceId,
              row,
              col,
              shape,
              rotation,
              flip,
              pieceSize,
              // Store bounds for later use
              height: shape.length,
              width: shape[0].length
            });
          }
        }
      }
    }
  }

  return moves;
}

/**
 * Get all unique transformations of a piece (rotations and flips)
 * @param {Array} baseShape - Original piece shape
 * @returns {Array} Array of {shape, rotation, flip} objects
 */
function getAllTransformations(baseShape) {
  const transformations = [];
  const seen = new Set();

  // Try all combinations of rotations (0, 90, 180, 270) and flips (normal, flipped)
  for (let flip = 0; flip < 2; flip++) {
    let currentShape = flip === 0 ? baseShape : flipPiece(baseShape);

    for (let rotation = 0; rotation < 4; rotation++) {
      // Create unique key for this transformation
      const key = shapeToString(currentShape);

      if (!seen.has(key)) {
        seen.add(key);
        transformations.push({
          shape: currentShape,
          rotation: rotation * 90,
          flip: flip === 1
        });
      }

      // Rotate for next iteration
      currentShape = rotatePiece(currentShape);
    }
  }

  return transformations;
}

/**
 * Convert shape to string for uniqueness checking
 * @param {Array} shape - Piece shape array
 * @returns {string} String representation of shape
 */
function shapeToString(shape) {
  return shape.map(row => row.join('')).join('|');
}

/**
 * Quick check if a player has any valid moves (optimized)
 * @param {Array} board - Current board state
 * @param {number} playerId - Player color ID
 * @param {Object} usedPieces - Used pieces tracker
 * @param {boolean} isFirstMove - Is first move
 * @returns {boolean} True if player has at least one valid move
 */
export function hasAnyValidMove(board, playerId, usedPieces, isFirstMove) {
  const availablePieces = Object.keys(PIECE_SHAPES).filter(
    pieceId => !usedPieces[playerId].includes(pieceId)
  );

  if (availablePieces.length === 0) return false;

  // Try smallest pieces first for quick check
  availablePieces.sort((a, b) => {
    const sizeA = PIECE_SHAPES[a].flat().filter(c => c === 1).length;
    const sizeB = PIECE_SHAPES[b].flat().filter(c => c === 1).length;
    return sizeA - sizeB;
  });

  for (const pieceId of availablePieces) {
    const baseShape = PIECE_SHAPES[pieceId];
    const transformations = getAllTransformations(baseShape);

    for (const { shape } of transformations) {
      // Sample positions instead of checking all
      for (let row = -4; row < 24; row += 2) {
        for (let col = -4; col < 24; col += 2) {
          if (isValidPlacement(board, row, col, shape, playerId, isFirstMove).valid) {
            return true;
          }
        }
      }
    }
  }

  return false;
}
