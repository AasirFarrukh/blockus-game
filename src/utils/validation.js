// Check if placement is within board bounds
export const isWithinBounds = (row, col, shape, boardSize = 20) => {
  const height = shape.length;
  const width = shape[0].length;
  
  return row >= 0 && col >= 0 && 
         row + height <= boardSize && 
         col + width <= boardSize;
};

// Check if placement overlaps with existing pieces
export const hasOverlap = (board, row, col, shape) => {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c] === 1 && board[row + r][col + c] !== null) {
        return true;
      }
    }
  }
  return false;
};

// Check if piece touches corner of player's existing pieces
export const touchesCorner = (board, row, col, shape, playerId, isFirstMove) => {
  if (isFirstMove) {
    // First move must touch player's starting corner
    const corners = [
      { r: 0, c: 0 },      // Player 0 (top-left)
      { r: 0, c: 19 },     // Player 1 (top-right)
      { r: 19, c: 19 },    // Player 2 (bottom-right)
      { r: 19, c: 0 }      // Player 3 (bottom-left)
    ];
    
    const corner = corners[playerId];
    
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[0].length; c++) {
        if (shape[r][c] === 1) {
          if (row + r === corner.r && col + c === corner.c) {
            return true;
          }
        }
      }
    }
    return false;
  }
  
  // Check diagonal corners
  const directions = [
    { dr: -1, dc: -1 }, // top-left
    { dr: -1, dc: 1 },  // top-right
    { dr: 1, dc: -1 },  // bottom-left
    { dr: 1, dc: 1 }    // bottom-right
  ];
  
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c] === 1) {
        for (const { dr, dc } of directions) {
          const newRow = row + r + dr;
          const newCol = col + c + dc;
          
          if (newRow >= 0 && newRow < 20 && newCol >= 0 && newCol < 20) {
            if (board[newRow][newCol] === playerId) {
              return true;
            }
          }
        }
      }
    }
  }
  
  return false;
};

// Check if piece touches edge of player's existing pieces (NOT allowed)
export const touchesEdge = (board, row, col, shape, playerId) => {
  const directions = [
    { dr: -1, dc: 0 },  // top
    { dr: 1, dc: 0 },   // bottom
    { dr: 0, dc: -1 },  // left
    { dr: 0, dc: 1 }    // right
  ];
  
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c] === 1) {
        for (const { dr, dc } of directions) {
          const newRow = row + r + dr;
          const newCol = col + c + dc;
          
          if (newRow >= 0 && newRow < 20 && newCol >= 0 && newCol < 20) {
            if (board[newRow][newCol] === playerId) {
              return true;
            }
          }
        }
      }
    }
  }
  
  return false;
};

// Main validation function
export const isValidPlacement = (board, row, col, shape, playerId, isFirstMove) => {
  // Check bounds
  if (!isWithinBounds(row, col, shape)) {
    return { valid: false, reason: 'Out of bounds' };
  }
  
  // Check overlap
  if (hasOverlap(board, row, col, shape)) {
    return { valid: false, reason: 'Overlaps existing piece' };
  }
  
  // Check corner touch
  if (!touchesCorner(board, row, col, shape, playerId, isFirstMove)) {
    return { valid: false, reason: 'Must touch corner of your pieces' };
  }
  
  // Check edge touch (not allowed except first move)
  if (!isFirstMove && touchesEdge(board, row, col, shape, playerId)) {
    return { valid: false, reason: 'Cannot touch edge of your pieces' };
  }
  
  return { valid: true };
};