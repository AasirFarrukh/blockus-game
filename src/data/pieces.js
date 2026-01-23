// All 21 official Blokus pieces based on the game manual
// Organized by number of squares: 1, 1, 2, 5, 12

export const PIECE_SHAPES = {
  // 1 square (1 piece)
  MONO: [[1]],

  // 2 squares (1 piece)
  DOMINO: [[1, 1]],

  // 3 squares (2 pieces)
  I3: [[1, 1, 1]],
  L3: [
    [1, 0],
    [1, 1]
  ],

  // 4 squares (5 pieces - Tetrominoes)
  I4: [[1, 1, 1, 1]],

  O4: [
    [1, 1],
    [1, 1]
  ],

  T4: [
    [1, 1, 1],
    [0, 1, 0]
  ],

  L4: [
    [1, 0],
    [1, 0],
    [1, 1]
  ],

  S4: [
    [0, 1, 1],
    [1, 1, 0]
  ],

  // 5 squares (12 pieces - Pentominoes)
  I5: [[1, 1, 1, 1, 1]],

  L5: [
    [1, 0],
    [1, 0],
    [1, 0],
    [1, 1]
  ],

  Y5: [
    [0, 1],
    [1, 1],
    [0, 1],
    [0, 1]
  ],

  N5: [
    [0, 1],
    [0, 1],
    [1, 1],
    [1, 0]
  ],

  V5: [
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 1]
  ],

  T5: [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0]
  ],

  Z5: [
    [1, 1, 0],
    [0, 1, 0],
    [0, 1, 1]
  ],

  P5: [
    [1, 1],
    [1, 1],
    [1, 0]
  ],

  W5: [
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 1]
  ],

  U5: [
    [1, 0, 1],
    [1, 1, 1]
  ],

  F5: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 1, 0]
  ],

  X5: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0]
  ]
};

export const PLAYER_COLORS = {
  0: '#0066CB', // Blue (from Blokus logo)
  1: '#CC0001', // Red (from Blokus logo)
  2: '#019934', // Green (from Blokus logo)
  3: '#FFCC01'  // Yellow (from Blokus logo)
};

export const COLOR_NAMES = {
  0: 'Blue',
  1: 'Red',
  2: 'Green',
  3: 'Yellow'
};

export const PLAYER_NAMES = {
  0: 'Player 1 (Blue)',
  1: 'Player 2 (Red)',
  2: 'Player 3 (Green)',
  3: 'Player 4 (Yellow)'
};

// Player mode configurations
// Maps color index to player index for each mode
export const PLAYER_MODES = {
  2: {
    // 2 players: each controls 2 diagonal colors
    colorToPlayer: { 0: 0, 1: 1, 2: 0, 3: 1 }, // Blue+Green = P1, Red+Yellow = P2
    playerColors: { 0: [0, 2], 1: [1, 3] }, // Player 0 has Blue(0) and Green(2)
    playerNames: { 0: 'Player 1', 1: 'Player 2' },
    neutralColor: null
  },
  3: {
    // 3 players: each controls 1 color, 4th is neutral (played in rotation)
    colorToPlayer: { 0: 0, 1: 1, 2: 2, 3: 'neutral' },
    playerColors: { 0: [0], 1: [1], 2: [2] },
    playerNames: { 0: 'Player 1', 1: 'Player 2', 2: 'Player 3' },
    neutralColor: 3 // Yellow is neutral
  },
  4: {
    // 4 players: each controls 1 color
    colorToPlayer: { 0: 0, 1: 1, 2: 2, 3: 3 },
    playerColors: { 0: [0], 1: [1], 2: [2], 3: [3] },
    playerNames: { 0: 'Player 1', 1: 'Player 2', 2: 'Player 3', 3: 'Player 4' },
    neutralColor: null
  }
};
