// Rotate a piece 90 degrees clockwise
export const rotatePiece = (shape) => {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }
  
  return rotated;
};

// Flip a piece horizontally
export const flipPiece = (shape) => {
  return shape.map(row => [...row].reverse());
};

// Get piece dimensions
export const getPieceDimensions = (shape) => {
  return {
    height: shape.length,
    width: shape[0].length
  };
};

// Calculate score (number of squares covered)
export const calculateScore = (pieces) => {
  return pieces.reduce((total, piece) => {
    return total + piece.shape.flat().filter(cell => cell === 1).length;
  }, 0);
};