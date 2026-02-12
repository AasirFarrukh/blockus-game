/**
 * AI Move Evaluator - Evaluates and selects moves based on difficulty
 */

/**
 * Select the best move based on difficulty level
 * @param {Array} moves - Array of all legal moves
 * @param {Array} board - Current board state
 * @param {number} playerId - Current player ID (color ID)
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {Object} usedPieces - Used pieces tracker
 * @param {boolean} isFirstMove - Is this the first move
 * @param {number} playerCount - Number of players
 * @param {Array} allyColors - Colors controlled by same player
 * @param {Array} opponentColors - Colors controlled by opponents
 * @returns {Object} Selected move
 */
export function selectMove(moves, board, playerId, difficulty, usedPieces, isFirstMove, playerCount = 4, allyColors = null, opponentColors = null) {
  if (!moves || moves.length === 0) return null;

  // Default to treating current color as only ally if not specified
  const allies = allyColors || [playerId];
  const opponents = opponentColors || [0, 1, 2, 3].filter(c => c !== playerId);

  switch (difficulty) {
    case 'easy':
      return selectEasyMove(moves, playerId, usedPieces);
    case 'medium':
      return selectMediumMove(moves, board, playerId, usedPieces, isFirstMove, allies, opponents);
    case 'hard':
      return selectHardMove(moves, board, playerId, usedPieces, isFirstMove, allies, opponents);
    default:
      return selectEasyMove(moves, playerId, usedPieces);
  }
}

/**
 * Easy AI: Mostly random with slight preference for larger pieces
 */
function selectEasyMove(moves, playerId, usedPieces) {
  // Add player-specific randomness for variety between CPU players
  const playerVariety = (playerId + 1) * 3;

  // Add a tiny bit of strategy - slightly prefer larger pieces
  const scoredMoves = moves.map(move => ({
    ...move,
    score: Math.random() * 20 + move.pieceSize * 2 + playerVariety * Math.random()
  }));

  scoredMoves.sort((a, b) => b.score - a.score);
  // Pick from top 40% for variety while still being somewhat strategic
  const topMoves = scoredMoves.slice(0, Math.max(1, Math.floor(moves.length * 0.4)));
  return topMoves[Math.floor(Math.random() * topMoves.length)];
}

/**
 * Check if opponents recently used this piece (for variety)
 */
function getVarietyBonus(pieceId, playerId, usedPieces, opponents) {
  let varietyBonus = 0;

  // Check if any opponent used this exact piece recently (in their last 3 moves)
  for (const opponentId of opponents) {
    const opponentPieces = usedPieces[opponentId] || [];
    const recentPieces = opponentPieces.slice(-3); // Last 3 pieces

    if (recentPieces.includes(pieceId)) {
      // Opponent used this piece recently - slight penalty to encourage variety
      varietyBonus -= 5;
    }
  }

  // Add player-specific variety factor
  const playerVarietyFactor = (playerId + 1) * Math.random() * 8;
  varietyBonus += playerVarietyFactor;

  return varietyBonus;
}

/**
 * Medium AI: Basic strategy - prefers center, larger pieces early, avoids corners
 */
function selectMediumMove(moves, board, playerId, usedPieces, isFirstMove, allies, opponents) {
  const totalUsedPieces = Object.values(usedPieces).reduce((sum, pieces) => sum + pieces.length, 0);
  const isEarlyGame = totalUsedPieces < 20; // First ~5 moves per player

  // Check if this is 2-player mode
  const is2PlayerMode = allies.length > 1 && allies.includes(playerId);

  const scoredMoves = moves.map(move => {
    let score = 0;

    // 1. Piece size strategy: Use large pieces early, save small ones for later
    if (isEarlyGame) {
      // Add randomness to avoid always picking the same pieces
      score += move.pieceSize * 8 + Math.random() * 12;
      // Add variety bonus to avoid picking same pieces as opponents
      score += getVarietyBonus(move.pieceId, playerId, usedPieces, opponents);
    } else {
      score += move.pieceSize * 2 + Math.random() * 6;
    }

    // 2. Center positioning: Prefer moves closer to center
    const centerRow = 10;
    const centerCol = 10;
    const moveRow = move.row + move.height / 2;
    const moveCol = move.col + move.width / 2;
    const distanceToCenter = Math.sqrt(
      Math.pow(moveRow - centerRow, 2) + Math.pow(moveCol - centerCol, 2)
    );
    score += Math.max(0, 20 - distanceToCenter); // Max 20 points for center

    // 3. Avoid extreme corners and edges
    const isBoardEdge = move.row <= 1 || move.col <= 1 ||
                       move.row + move.height >= 19 || move.col + move.width >= 19;
    if (isBoardEdge) {
      score -= 10; // Penalty for edge placements
    }

    // 4. Flexibility: Count potential corner connections created (considering all ally colors)
    const cornerConnections = countCornerConnections(board, move, playerId, allies);
    score += cornerConnections * 5;

    // 5. In 2-player mode, basic territory awareness
    if (is2PlayerMode) {
      const testBoard = simulatePlacement(board, move, playerId);
      const territory = calculateTerritory(testBoard, allies);
      score += territory * 1.5;
    }

    // 6. Small random factor for variety
    score += Math.random() * 3;

    return { ...move, score };
  });

  // Sort by score and pick from top 5 for some variety
  scoredMoves.sort((a, b) => b.score - a.score);
  const topMoves = scoredMoves.slice(0, Math.min(5, scoredMoves.length));
  return topMoves[Math.floor(Math.random() * topMoves.length)];
}

/**
 * Hard AI: Advanced strategy with blocking, territory control, and lookahead
 */
function selectHardMove(moves, board, playerId, usedPieces, isFirstMove, allies, opponents) {
  const totalUsedPieces = Object.values(usedPieces).reduce((sum, pieces) => sum + pieces.length, 0);
  const isEarlyGame = totalUsedPieces < 16;
  const isMidGame = totalUsedPieces >= 16 && totalUsedPieces < 48;
  const isLateGame = totalUsedPieces >= 48;

  // Check if this is 2-player mode (allies.length > 1)
  const is2PlayerMode = allies.length > 1 && allies.includes(playerId);
  const is3PlayerMode = allies.length === 2 && opponents.length === 3;

  const scoredMoves = moves.map(move => {
    let score = 0;

    // Simulate the move
    const testBoard = simulatePlacement(board, move, playerId);

    // 1. Territory Control: Count accessible empty squares for ALL ally colors
    const territoryScore = calculateTerritory(testBoard, allies);
    score += territoryScore * 3;

    // 1b. In 2-player mode, bonus for moves that create synergy between ally colors
    if (is2PlayerMode && allies.length === 2) {
      const otherAllyColor = allies.find(c => c !== playerId);
      const synergyBonus = calculateSynergy(testBoard, playerId, otherAllyColor);
      score += synergyBonus * 4;
    }

    // 2. Piece sequencing strategy
    if (isEarlyGame) {
      // Early: Use large pieces (5 squares), save versatile small pieces
      // Add randomness to piece selection to avoid predictability
      if (move.pieceSize === 5) score += 15 + Math.random() * 10;
      else if (move.pieceSize === 4) score += 10 + Math.random() * 8;
      else score += 3 + Math.random() * 5;
      // Add variety bonus to avoid copying opponents' piece choices
      score += getVarietyBonus(move.pieceId, playerId, usedPieces, opponents);
    } else if (isMidGame) {
      // Mid: Balanced approach
      score += move.pieceSize * 4 + Math.random() * 6;
    } else {
      // Late: Small pieces are valuable for tight spaces
      if (move.pieceSize <= 2) score += 20 + Math.random() * 5;
      else score += move.pieceSize * 2 + Math.random() * 4;
    }

    // 3. Strategic positioning
    const centerRow = 10;
    const centerCol = 10;
    const moveRow = move.row + move.height / 2;
    const moveCol = move.col + move.width / 2;
    const distanceToCenter = Math.sqrt(
      Math.pow(moveRow - centerRow, 2) + Math.pow(moveCol - centerCol, 2)
    );

    if (isEarlyGame || isMidGame) {
      score += Math.max(0, 25 - distanceToCenter); // Prefer center early/mid
    } else {
      score += Math.max(0, 10 - distanceToCenter); // Less important late game
    }

    // 4. Flexibility: Maximize corner connections (considering ally colors)
    const corners = countCornerConnections(testBoard, move, playerId, allies);
    score += corners * 8;

    // 5. Blocking opponents (specifically target opponent colors)
    const blockingValue = calculateBlockingValue(board, testBoard, opponents);
    // In 3-player mode, blocking is more valuable due to more competition
    const blockingMultiplier = is3PlayerMode ? 8 : 6;
    score += blockingValue * blockingMultiplier;

    // 6. Avoid isolated positions in late game
    if (isLateGame) {
      const connectivity = calculateConnectivity(testBoard, move, allies);
      score += connectivity * 5;
    }

    // 7. Small random factor to avoid completely predictable play
    score += Math.random() * 2;

    return { ...move, score };
  });

  // Sort by score and pick from top 3 moves for slight variety
  scoredMoves.sort((a, b) => b.score - a.score);
  const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
  return topMoves[Math.floor(Math.random() * topMoves.length)];
}

/**
 * Simulate placing a move on the board
 */
function simulatePlacement(board, move, playerId) {
  const newBoard = board.map(row => [...row]);

  for (let r = 0; r < move.shape.length; r++) {
    for (let c = 0; c < move.shape[0].length; c++) {
      if (move.shape[r][c] === 1) {
        const boardRow = move.row + r;
        const boardCol = move.col + c;
        if (boardRow >= 0 && boardRow < 20 && boardCol >= 0 && boardCol < 20) {
          newBoard[boardRow][boardCol] = playerId;
        }
      }
    }
  }

  return newBoard;
}

/**
 * Count corner connections available from a position
 * In 2-player mode, also considers connections to ally colors
 */
function countCornerConnections(board, move, playerId, allies = [playerId]) {
  const testBoard = simulatePlacement(board, move, playerId);
  let connections = 0;

  const corners = [
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ];

  for (let r = 0; r < move.shape.length; r++) {
    for (let c = 0; c < move.shape[0].length; c++) {
      if (move.shape[r][c] === 1) {
        const boardRow = move.row + r;
        const boardCol = move.col + c;

        for (const [dr, dc] of corners) {
          const checkRow = boardRow + dr;
          const checkCol = boardCol + dc;

          if (checkRow >= 0 && checkRow < 20 && checkCol >= 0 && checkCol < 20) {
            const cellValue = testBoard[checkRow][checkCol];
            // Count empty spaces and spaces with ally colors
            if (cellValue === null || (allies.includes(cellValue) && cellValue !== playerId)) {
              connections++;
            }
          }
        }
      }
    }
  }

  return connections;
}

/**
 * Calculate accessible territory (empty squares reachable via corners)
 * Considers all colors controlled by the same player
 */
function calculateTerritory(board, allies) {
  let territory = 0;
  const checked = new Set();

  // Find all ally pieces
  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 20; c++) {
      if (allies.includes(board[r][c])) {
        // Check diagonal corners
        const corners = [[r-1,c-1], [r-1,c+1], [r+1,c-1], [r+1,c+1]];

        for (const [cr, cc] of corners) {
          if (cr >= 0 && cr < 20 && cc >= 0 && cc < 20) {
            const key = `${cr},${cc}`;
            if (!checked.has(key) && board[cr][cc] === null) {
              checked.add(key);
              territory++;
            }
          }
        }
      }
    }
  }

  return territory;
}

/**
 * Calculate how much this move blocks opponents
 * Specifically targets opponent colors
 */
function calculateBlockingValue(oldBoard, newBoard, opponents) {
  let blockingValue = 0;

  // Count occupied squares that could have been used by opponents
  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 20; c++) {
      if (oldBoard[r][c] === null && newBoard[r][c] !== null) {
        // Check if this square was adjacent to opponent corners
        const corners = [[r-1,c-1], [r-1,c+1], [r+1,c-1], [r+1,c+1]];

        for (const [cr, cc] of corners) {
          if (cr >= 0 && cr < 20 && cc >= 0 && cc < 20) {
            if (opponents.includes(oldBoard[cr][cc])) {
              blockingValue += 2;
            }
          }
        }
      }
    }
  }

  return blockingValue;
}

/**
 * Calculate connectivity (how well connected the piece is to existing pieces)
 * Considers connections to all ally colors
 */
function calculateConnectivity(board, move, allies) {
  let connectivity = 0;

  for (let r = 0; r < move.shape.length; r++) {
    for (let c = 0; c < move.shape[0].length; c++) {
      if (move.shape[r][c] === 1) {
        const boardRow = move.row + r;
        const boardCol = move.col + c;

        // Check diagonals for ally colors
        const corners = [[boardRow-1,boardCol-1], [boardRow-1,boardCol+1],
                        [boardRow+1,boardCol-1], [boardRow+1,boardCol+1]];

        for (const [cr, cc] of corners) {
          if (cr >= 0 && cr < 20 && cc >= 0 && cc < 20) {
            if (allies.includes(board[cr][cc])) {
              connectivity++;
            }
          }
        }
      }
    }
  }

  return connectivity;
}

/**
 * Calculate synergy between two ally colors (for 2-player mode)
 * Rewards moves that create mutual expansion opportunities
 */
function calculateSynergy(board, currentColor, otherAllyColor) {
  let synergy = 0;

  // Find pieces of both colors that are near each other
  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 20; c++) {
      if (board[r][c] === currentColor) {
        // Check nearby area for ally color
        for (let dr = -3; dr <= 3; dr++) {
          for (let dc = -3; dc <= 3; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < 20 && nc >= 0 && nc < 20) {
              if (board[nr][nc] === otherAllyColor) {
                // Pieces are near each other - good for creating combined territory
                const distance = Math.abs(dr) + Math.abs(dc);
                synergy += Math.max(0, 4 - distance); // Closer = better
              }
            }
          }
        }
      }
    }
  }

  return synergy;
}
