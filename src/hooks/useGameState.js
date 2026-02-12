import { useState, useCallback, useEffect, useRef } from 'react';
import { PIECE_SHAPES, PLAYER_MODES } from '../data/pieces';
import { isValidPlacement } from '../utils/validation';
import { generateAIMove, getAIThinkingTime } from '../ai/AIController';

// Check if a color has any valid moves
const hasValidMoves = (board, colorId, usedPieces, isFirstMove) => {
  const availablePieces = Object.keys(PIECE_SHAPES).filter(
    pieceId => !usedPieces[colorId].includes(pieceId)
  );

  if (availablePieces.length === 0) return false;

  // Check each available piece
  for (const pieceId of availablePieces) {
    let shape = PIECE_SHAPES[pieceId];

    // Try all rotations and flips
    for (let flip = 0; flip < 2; flip++) {
      for (let rot = 0; rot < 4; rot++) {
        // Try all positions on the board
        for (let row = -4; row < 24; row++) {
          for (let col = -4; col < 24; col++) {
            const result = isValidPlacement(board, row, col, shape, colorId, isFirstMove);
            if (result.valid) {
              return true;
            }
          }
        }
        // Rotate shape 90 degrees
        const currentShape = shape;
        shape = currentShape[0].map((_, i) => currentShape.map(row => row[i]).reverse());
      }
      // Flip shape horizontally
      shape = PIECE_SHAPES[pieceId].map(row => [...row].reverse());
    }
  }

  return false;
};

export const useGameState = (initialPlayerCount = 4, gameConfig = null) => {
  const [playerCount, setPlayerCount] = useState(initialPlayerCount);

  // Player types: 'human' or 'cpu'
  const [playerTypes, setPlayerTypes] = useState({
    0: 'human',
    1: 'human',
    2: 'human',
    3: 'human'
  });

  // CPU difficulty for all CPU players
  const [cpuDifficulty, setCpuDifficulty] = useState('medium');

  // Custom player names
  const [playerNames, setPlayerNames] = useState(null);

  // Initialize 20x20 board with null values
  const [board, setBoard] = useState(
    Array(20).fill().map(() => Array(20).fill(null))
  );

  const [currentPlayer, setCurrentPlayer] = useState(0);

  // AI processing state
  const aiTimeoutRef = useRef(null);
  const lastMoveTimeRef = useRef(0);
  const previousPlayerTypeRef = useRef('human');

  // Track which pieces each player has used
  const [usedPieces, setUsedPieces] = useState({
    0: [],
    1: [],
    2: [],
    3: []
  });

  // Track if it's each player's first move
  const [firstMoves, setFirstMoves] = useState({
    0: true,
    1: true,
    2: true,
    3: true
  });

  // Track which colors are out (no valid moves)
  const [playersOut, setPlayersOut] = useState({
    0: false,
    1: false,
    2: false,
    3: false
  });

  const [selectedPiece, setSelectedPiece] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  // History for undo functionality
  const [history, setHistory] = useState([]);

  // For 3-player mode: track whose turn it is to play the neutral color
  const [neutralTurnPlayer, setNeutralTurnPlayer] = useState(0);

  // Get the actual player controlling the current color
  const getCurrentPlayer = useCallback((colorId) => {
    const mode = PLAYER_MODES[playerCount];
    if (playerCount === 3 && colorId === mode.neutralColor) {
      return neutralTurnPlayer; // Return the player who's playing neutral this turn
    }
    return mode.colorToPlayer[colorId];
  }, [playerCount, neutralTurnPlayer]);

  // Check if current color is neutral
  const isNeutralColor = useCallback((colorId) => {
    if (playerCount !== 3) return false;
    return colorId === PLAYER_MODES[3].neutralColor;
  }, [playerCount]);

  // Find next color who can still play
  const findNextPlayer = useCallback((startColor, newBoard, newUsedPieces, newFirstMoves, newPlayersOut, currentNeutralTurnPlayer) => {
    let nextColor = (startColor + 1) % 4;
    let checked = 0;
    let newNeutralTurnPlayer = currentNeutralTurnPlayer;
    const skippedPlayers = []; // Track which players were skipped

    // For 3-player mode, update neutral turn player when moving past the neutral color
    if (playerCount === 3 && startColor === PLAYER_MODES[3].neutralColor) {
      newNeutralTurnPlayer = (currentNeutralTurnPlayer + 1) % 3;
    }

    while (checked < 4) {
      if (!newPlayersOut[nextColor]) {
        // Check if this color has valid moves
        if (hasValidMoves(newBoard, nextColor, newUsedPieces, newFirstMoves[nextColor])) {
          return { nextPlayer: nextColor, updatedPlayersOut: newPlayersOut, newNeutralTurnPlayer, skippedPlayers };
        } else {
          // Mark color as out and track it
          newPlayersOut = { ...newPlayersOut, [nextColor]: true };
          skippedPlayers.push(nextColor);
        }
      }

      // For 3-player mode, update neutral turn player when skipping past the neutral color
      if (playerCount === 3 && nextColor === PLAYER_MODES[3].neutralColor) {
        newNeutralTurnPlayer = (newNeutralTurnPlayer + 1) % 3;
      }

      nextColor = (nextColor + 1) % 4;
      checked++;
    }

    // All colors are out - game over
    return { nextPlayer: startColor, updatedPlayersOut: newPlayersOut, gameOver: true, newNeutralTurnPlayer, skippedPlayers };
  }, [playerCount]);

  // Place a piece on the board
  const placePiece = useCallback((row, col, shape, pieceId) => {
    const validation = isValidPlacement(
      board,
      row,
      col,
      shape,
      currentPlayer,
      firstMoves[currentPlayer]
    );

    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    // Save current state to history before making changes
    setHistory(prev => [...prev, {
      board: board.map(r => [...r]),
      currentPlayer,
      usedPieces: { ...usedPieces },
      firstMoves: { ...firstMoves },
      playersOut: { ...playersOut },
      neutralTurnPlayer
    }]);

    // Update board
    const newBoard = board.map(r => [...r]);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[0].length; c++) {
        if (shape[r][c] === 1) {
          newBoard[row + r][col + c] = currentPlayer;
        }
      }
    }

    // Mark piece as used
    const newUsedPieces = {
      ...usedPieces,
      [currentPlayer]: [...usedPieces[currentPlayer], pieceId]
    };

    // Update first move status
    const newFirstMoves = firstMoves[currentPlayer]
      ? { ...firstMoves, [currentPlayer]: false }
      : firstMoves;

    // Find next color (auto-skip those without valid moves)
    const { nextPlayer, updatedPlayersOut, gameOver: isGameOver, newNeutralTurnPlayer, skippedPlayers } = findNextPlayer(
      currentPlayer,
      newBoard,
      newUsedPieces,
      newFirstMoves,
      playersOut,
      neutralTurnPlayer
    );

    setBoard(newBoard);
    setUsedPieces(newUsedPieces);
    setFirstMoves(newFirstMoves);
    setPlayersOut(updatedPlayersOut);
    setCurrentPlayer(nextPlayer);
    setSelectedPiece(null);
    if (newNeutralTurnPlayer !== undefined) {
      setNeutralTurnPlayer(newNeutralTurnPlayer);
    }

    if (isGameOver) {
      setGameOver(true);
    }

    return { success: true, skippedPlayers };
  }, [board, currentPlayer, firstMoves, usedPieces, playersOut, neutralTurnPlayer, findNextPlayer]);

  // Undo last move
  const undoMove = useCallback(() => {
    if (history.length === 0) return false;

    const lastState = history[history.length - 1];
    setBoard(lastState.board);
    setCurrentPlayer(lastState.currentPlayer);
    setUsedPieces(lastState.usedPieces);
    setFirstMoves(lastState.firstMoves);
    setPlayersOut(lastState.playersOut);
    if (lastState.neutralTurnPlayer !== undefined) {
      setNeutralTurnPlayer(lastState.neutralTurnPlayer);
    }
    setHistory(prev => prev.slice(0, -1));
    setSelectedPiece(null);
    setGameOver(false);

    return true;
  }, [history]);

  // Pass turn to next color
  const passTurn = useCallback(() => {
    const { nextPlayer, updatedPlayersOut, gameOver: isGameOver, newNeutralTurnPlayer } = findNextPlayer(
      currentPlayer,
      board,
      usedPieces,
      firstMoves,
      playersOut,
      neutralTurnPlayer
    );

    setPlayersOut(updatedPlayersOut);
    setCurrentPlayer(nextPlayer);
    setSelectedPiece(null);
    if (newNeutralTurnPlayer !== undefined) {
      setNeutralTurnPlayer(newNeutralTurnPlayer);
    }

    if (isGameOver) {
      setGameOver(true);
    }

    return true;
  }, [board, currentPlayer, firstMoves, usedPieces, playersOut, neutralTurnPlayer, findNextPlayer]);

  // Reset game
  const resetGame = useCallback((config) => {
    // Clear any pending AI timeouts
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }

    // Handle both old (number) and new (config object) formats
    let newPlayerCount = playerCount;
    let newPlayerTypes = { 0: 'human', 1: 'human', 2: 'human', 3: 'human' };
    let newDifficulty = 'medium';
    let newPlayerNames = null;

    if (typeof config === 'number') {
      newPlayerCount = config;
    } else if (config && typeof config === 'object') {
      newPlayerCount = config.playerCount || 4;

      if (config.gameMode === 'cpu') {
        // Set up player types based on human player count and game mode
        const humanCount = config.humanPlayerCount || 1;
        newDifficulty = config.cpuDifficulty || 'medium';

        if (newPlayerCount === 2) {
          // 2-player mode: Player 0 controls colors 0&2, Player 1 controls colors 1&3
          // If humanCount = 1: Player 0 (human) gets colors 0&2, Player 1 (CPU) gets colors 1&3
          // If humanCount = 2: Both players are human
          const player0IsHuman = humanCount >= 1;
          const player1IsHuman = humanCount >= 2;

          newPlayerTypes[0] = player0IsHuman ? 'human' : 'cpu'; // Blue (Player 0)
          newPlayerTypes[2] = player0IsHuman ? 'human' : 'cpu'; // Green (Player 0)
          newPlayerTypes[1] = player1IsHuman ? 'human' : 'cpu'; // Red (Player 1)
          newPlayerTypes[3] = player1IsHuman ? 'human' : 'cpu'; // Yellow (Player 1)
        } else if (newPlayerCount === 3) {
          // 3-player mode: Colors 0,1,2 map to players 0,1,2; Color 3 is neutral
          // Neutral color is always controlled by whoever's turn it is
          for (let i = 0; i < 3; i++) {
            newPlayerTypes[i] = i < humanCount ? 'human' : 'cpu';
          }
          newPlayerTypes[3] = 'human'; // Neutral is controlled by current player
        } else {
          // 4-player mode: Direct 1:1 mapping
          for (let i = 0; i < 4; i++) {
            newPlayerTypes[i] = i < humanCount ? 'human' : 'cpu';
          }
        }
      }

      // Store custom player names if provided
      if (config.playerNames && Array.isArray(config.playerNames)) {
        const filteredNames = config.playerNames.filter(name => name && name.trim());
        if (filteredNames.length > 0) {
          newPlayerNames = config.playerNames;
        }
      }
    }

    setPlayerCount(newPlayerCount);
    setPlayerTypes(newPlayerTypes);
    setCpuDifficulty(newDifficulty);
    setPlayerNames(newPlayerNames);
    setBoard(Array(20).fill().map(() => Array(20).fill(null)));
    setCurrentPlayer(0);
    setUsedPieces({ 0: [], 1: [], 2: [], 3: [] });
    setFirstMoves({ 0: true, 1: true, 2: true, 3: true });
    setPlayersOut({ 0: false, 1: false, 2: false, 3: false });
    setSelectedPiece(null);
    setGameOver(false);
    setHistory([]);
    setNeutralTurnPlayer(0);
  }, [playerCount]);

  // AI move trigger
  useEffect(() => {
    // Determine if current turn should be controlled by AI
    let shouldAIPlay = false;

    if (playerCount === 3 && currentPlayer === PLAYER_MODES[3].neutralColor) {
      // For neutral color in 3-player mode, check the controlling player
      shouldAIPlay = playerTypes[neutralTurnPlayer] === 'cpu';
    } else {
      // For other modes, check the color's player type
      shouldAIPlay = playerTypes[currentPlayer] === 'cpu';
    }

    if (shouldAIPlay && !gameOver && !playersOut[currentPlayer]) {
      // Calculate delay
      let totalDelay = getAIThinkingTime(cpuDifficulty);

      // Add extra delay if previous player was also CPU (to avoid rapid-fire moves)
      if (previousPlayerTypeRef.current === 'cpu') {
        totalDelay += 800; // Add 800ms between consecutive CPU moves
      }

      aiTimeoutRef.current = setTimeout(() => {
        // Determine ally and opponent colors based on player mode
        const mode = PLAYER_MODES[playerCount];
        let allyColors, opponentColors;

        if (playerCount === 2) {
          // In 2-player mode, find which player controls current color
          const actualPlayer = mode.colorToPlayer[currentPlayer];
          allyColors = mode.playerColors[actualPlayer];
          const opponentPlayer = actualPlayer === 0 ? 1 : 0;
          opponentColors = mode.playerColors[opponentPlayer];
        } else if (playerCount === 3) {
          // In 3-player mode
          if (currentPlayer === mode.neutralColor) {
            // When playing neutral color, it helps the controlling player
            const controllingPlayer = neutralTurnPlayer;
            allyColors = [controllingPlayer, currentPlayer]; // Player's color + neutral
            // Opponents are the other two players
            opponentColors = [0, 1, 2].filter(p => p !== controllingPlayer);
          } else {
            // Playing own color - only that color is ally
            allyColors = [currentPlayer];
            // Opponents are other players + neutral (since it rotates between opponents)
            opponentColors = [0, 1, 2, 3].filter(c => c !== currentPlayer);
          }
        } else {
          // In 4-player mode, simple 1:1
          allyColors = [currentPlayer];
          opponentColors = [0, 1, 2, 3].filter(c => c !== currentPlayer);
        }

        // Generate AI move with mode awareness
        const aiMove = generateAIMove(
          board,
          currentPlayer,
          usedPieces,
          firstMoves[currentPlayer],
          cpuDifficulty,
          playerCount,
          allyColors,
          opponentColors
        );

        if (aiMove) {
          // Place the AI's move
          placePiece(aiMove.row, aiMove.col, aiMove.shape, aiMove.pieceId);
        } else {
          // No valid moves, pass turn
          passTurn();
        }

        // Update tracking for next turn
        lastMoveTimeRef.current = Date.now();
        previousPlayerTypeRef.current = 'cpu';
        aiTimeoutRef.current = null;
      }, totalDelay);
    } else if (!shouldAIPlay) {
      // Track that previous player was human
      previousPlayerTypeRef.current = 'human';
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };
  }, [currentPlayer, gameOver, playersOut, playerTypes, cpuDifficulty, board, usedPieces, firstMoves, placePiece, passTurn, playerCount, neutralTurnPlayer]);

  return {
    board,
    currentPlayer,
    usedPieces,
    firstMoves,
    selectedPiece,
    setSelectedPiece,
    placePiece,
    resetGame,
    gameOver,
    setGameOver,
    undoMove,
    canUndo: history.length > 0,
    playersOut,
    passTurn,
    playerCount,
    neutralTurnPlayer,
    getCurrentPlayer,
    isNeutralColor,
    playerTypes,
    playerNames
  };
};
