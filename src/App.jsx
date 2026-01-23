import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import Board from './components/Board/Board';
import PieceSelector from './components/PieceSelector/PieceSelector';
import MobileControls from './components/MobileControls/MobileControls';
import TopMenu from './components/TopMenu/TopMenu';
import StartScreen from './components/StartScreen/StartScreen';
import { useGameState } from './hooks/useGameState';
import { isValidPlacement } from './utils/validation';
import { PLAYER_NAMES, PIECE_SHAPES, PLAYER_MODES, PLAYER_COLORS, COLOR_NAMES } from './data/pieces';
import { rotatePiece, flipPiece } from './utils/gameLogic';

// Sound effects using Web Audio API
const createSoundEffects = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const playTone = (frequency, duration, type = 'sine', volume = 0.3) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.value = volume;

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
  };

  return {
    place: () => {
      playTone(440, 0.1, 'sine', 0.2);
      setTimeout(() => playTone(880, 0.15, 'sine', 0.15), 50);
    },
    rotate: () => playTone(300, 0.08, 'square', 0.1),
    flip: () => playTone(350, 0.08, 'square', 0.1),
    invalid: () => {
      playTone(200, 0.15, 'sawtooth', 0.15);
    },
    select: () => playTone(600, 0.05, 'sine', 0.1),
    deselect: () => playTone(400, 0.05, 'sine', 0.1),
    undo: () => {
      playTone(500, 0.1, 'sine', 0.1);
      setTimeout(() => playTone(400, 0.1, 'sine', 0.1), 80);
    },
    gameOver: () => {
      [523, 659, 784, 1047].forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.3, 'sine', 0.2), i * 150);
      });
    }
  };
};

let sounds = null;

// Hook to detect mobile screen
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPlayerCount, setSelectedPlayerCount] = useState(4);

  // Mobile-specific state
  const isMobile = useIsMobile();
  const [mobilePosition, setMobilePosition] = useState({ row: 10, col: 10 });

  // Skipped players notification
  const [skippedNotification, setSkippedNotification] = useState(null);

  // Rotation/flip state (needed for mobile controls)
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const {
    board,
    currentPlayer,
    usedPieces,
    firstMoves,
    selectedPiece,
    setSelectedPiece,
    placePiece,
    resetGame,
    gameOver,
    undoMove,
    canUndo,
    playersOut,
    passTurn,
    playerCount,
    neutralTurnPlayer,
    getCurrentPlayer,
    isNeutralColor
  } = useGameState(selectedPlayerCount);

  // Initialize sounds on first interaction
  useEffect(() => {
    const initSounds = () => {
      if (!sounds) {
        sounds = createSoundEffects();
      }
      window.removeEventListener('click', initSounds);
    };
    window.addEventListener('click', initSounds);
    return () => window.removeEventListener('click', initSounds);
  }, []);

  // Play game over sound
  useEffect(() => {
    if (gameOver && sounds && soundEnabled) {
      sounds.gameOver();
    }
  }, [gameOver, soundEnabled]);

  // Escape key to deselect
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedPiece) {
        setSelectedPiece(null);
        if (sounds && soundEnabled) sounds.deselect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPiece, setSelectedPiece, soundEnabled]);

  const handleStartGame = (count) => {
    setSelectedPlayerCount(count);
    resetGame(count);
    setGameStarted(true);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.log('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for fullscreen changes (e.g., user pressing Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePlacePiece = (row, col, shape, pieceId) => {
    const result = placePiece(row, col, shape, pieceId);
    if (result && result.success) {
      if (sounds && soundEnabled) sounds.place();
      // Show notification if any players were skipped
      if (result.skippedPlayers && result.skippedPlayers.length > 0) {
        const skippedNames = result.skippedPlayers.map(id => COLOR_NAMES[id]);
        setSkippedNotification(skippedNames);
      }
    } else if (result && !result.success) {
      if (sounds && soundEnabled) sounds.invalid();
    }
    return result;
  };

  // Auto-dismiss skipped notification
  useEffect(() => {
    if (skippedNotification) {
      const timer = setTimeout(() => {
        setSkippedNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [skippedNotification]);

  const handleSelectPiece = (piece) => {
    if (piece && sounds && soundEnabled) sounds.select();
    else if (!piece && sounds && soundEnabled) sounds.deselect();

    // Reset rotation state when selecting a new piece or deselecting
    if (!piece || (piece && selectedPiece?.id !== piece.id)) {
      setRotation(0);
      setFlipped(false);
    }

    setSelectedPiece(piece);
  };

  // Desktop rotate/flip - just play sounds (PieceSelector handles the actual transformation)
  const handleRotate = useCallback(() => {
    if (sounds && soundEnabled) sounds.rotate();
  }, [soundEnabled]);

  const handleFlip = useCallback(() => {
    if (sounds && soundEnabled) sounds.flip();
  }, [soundEnabled]);

  // Mobile rotate - does the actual transformation
  const handleMobileRotate = useCallback(() => {
    if (!selectedPiece) return;

    const newRotation = (rotation + 1) % 4;
    setRotation(newRotation);

    // Apply transformations
    let transformedShape = selectedPiece.originalShape;
    if (flipped) {
      transformedShape = flipPiece(transformedShape);
    }
    for (let i = 0; i < newRotation; i++) {
      transformedShape = rotatePiece(transformedShape);
    }

    setSelectedPiece({
      ...selectedPiece,
      shape: transformedShape
    });

    if (sounds && soundEnabled) sounds.rotate();
  }, [selectedPiece, rotation, flipped, setSelectedPiece, soundEnabled]);

  // Mobile flip - does the actual transformation
  const handleMobileFlip = useCallback(() => {
    if (!selectedPiece) return;

    const newFlipped = !flipped;
    setFlipped(newFlipped);

    // Apply transformations
    let transformedShape = selectedPiece.originalShape;
    if (newFlipped) {
      transformedShape = flipPiece(transformedShape);
    }
    for (let i = 0; i < rotation; i++) {
      transformedShape = rotatePiece(transformedShape);
    }

    setSelectedPiece({
      ...selectedPiece,
      shape: transformedShape
    });

    if (sounds && soundEnabled) sounds.flip();
  }, [selectedPiece, rotation, flipped, setSelectedPiece, soundEnabled]);

  // Mobile: Move piece position
  const handleMobileMove = useCallback((direction) => {
    setMobilePosition(prev => {
      const newPos = { ...prev };
      switch (direction) {
        case 'up':
          newPos.row = Math.max(0, prev.row - 1);
          break;
        case 'down':
          newPos.row = Math.min(19, prev.row + 1);
          break;
        case 'left':
          newPos.col = Math.max(0, prev.col - 1);
          break;
        case 'right':
          newPos.col = Math.min(19, prev.col + 1);
          break;
        default:
          break;
      }
      return newPos;
    });
  }, []);

  // Mobile: Calculate shape center offset
  const shapeCenter = useMemo(() => {
    if (!selectedPiece) return { rowOffset: 0, colOffset: 0 };

    const { shape } = selectedPiece;
    const filledCells = [];
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[0].length; c++) {
        if (shape[r][c] === 1) {
          filledCells.push({ r, c });
        }
      }
    }

    const avgRow = filledCells.reduce((sum, cell) => sum + cell.r, 0) / filledCells.length;
    const avgCol = filledCells.reduce((sum, cell) => sum + cell.c, 0) / filledCells.length;

    return {
      rowOffset: Math.floor(avgRow),
      colOffset: Math.floor(avgCol)
    };
  }, [selectedPiece]);

  // Mobile: Check if current position is valid
  const isMobilePlacementValid = useMemo(() => {
    if (!selectedPiece || !isMobile) return false;

    const placementRow = mobilePosition.row - shapeCenter.rowOffset;
    const placementCol = mobilePosition.col - shapeCenter.colOffset;

    const result = isValidPlacement(
      board,
      placementRow,
      placementCol,
      selectedPiece.shape,
      currentPlayer,
      firstMoves[currentPlayer]
    );

    return result.valid;
  }, [selectedPiece, isMobile, mobilePosition, shapeCenter, board, currentPlayer, firstMoves]);

  // Mobile: Place piece at current position
  const handleMobilePlace = useCallback(() => {
    if (!selectedPiece || !isMobilePlacementValid) return;

    const placementRow = mobilePosition.row - shapeCenter.rowOffset;
    const placementCol = mobilePosition.col - shapeCenter.colOffset;

    const result = placePiece(placementRow, placementCol, selectedPiece.shape, selectedPiece.id);
    if (result && result.success) {
      if (sounds && soundEnabled) sounds.place();
      // Reset position to center for next piece
      setMobilePosition({ row: 10, col: 10 });
    } else if (result && !result.success) {
      if (sounds && soundEnabled) sounds.invalid();
    }
  }, [selectedPiece, isMobilePlacementValid, mobilePosition, shapeCenter, placePiece, soundEnabled]);

  // Mobile: Cancel selection
  const handleMobileCancel = useCallback(() => {
    setSelectedPiece(null);
    if (sounds && soundEnabled) sounds.deselect();
  }, [setSelectedPiece, soundEnabled]);

  // Reset mobile position when piece changes
  useEffect(() => {
    if (selectedPiece && isMobile) {
      // Start near the player's corner for first moves
      if (firstMoves[currentPlayer]) {
        const corners = [
          { row: 2, col: 2 },      // Blue - top left
          { row: 2, col: 17 },     // Red - top right
          { row: 17, col: 17 },    // Green - bottom right
          { row: 17, col: 2 }      // Yellow - bottom left
        ];
        setMobilePosition(corners[currentPlayer]);
      } else {
        setMobilePosition({ row: 10, col: 10 });
      }
    }
  }, [selectedPiece, isMobile, currentPlayer, firstMoves]);

  const handleUndo = () => {
    if (undoMove()) {
      if (sounds && soundEnabled) sounds.undo();
    }
  };

  const handlePass = () => {
    passTurn();
  };

  // Calculate score for a single color
  const calculateColorScore = (colorId) => {
    const used = usedPieces[colorId];
    return used.reduce((total, pieceId) => {
      const shape = PIECE_SHAPES[pieceId];
      const squares = shape.flat().filter(cell => cell === 1).length;
      return total + squares;
    }, 0);
  };

  // Calculate score for a player (combines colors in 2-player mode)
  const calculatePlayerScore = (playerId) => {
    const mode = PLAYER_MODES[playerCount];
    const colors = mode.playerColors[playerId];
    return colors.reduce((total, colorId) => total + calculateColorScore(colorId), 0);
  };

  // Get final scores for game over screen
  const getFinalScores = () => {
    const scores = [];

    if (playerCount === 2) {
      // 2-player mode: combine diagonal colors
      scores.push({
        id: 0,
        name: 'Player 1',
        score: calculatePlayerScore(0),
        colors: [0, 2] // Blue + Green
      });
      scores.push({
        id: 1,
        name: 'Player 2',
        score: calculatePlayerScore(1),
        colors: [1, 3] // Red + Yellow
      });
    } else if (playerCount === 3) {
      // 3-player mode: individual scores + neutral
      for (let i = 0; i < 3; i++) {
        scores.push({
          id: i,
          name: `Player ${i + 1}`,
          score: calculatePlayerScore(i),
          colors: [i]
        });
      }
      // Add neutral score separately (doesn't compete)
      scores.push({
        id: 'neutral',
        name: 'Neutral',
        score: calculateColorScore(3),
        colors: [3],
        isNeutral: true
      });
    } else {
      // 4-player mode: standard
      for (let i = 0; i < 4; i++) {
        scores.push({
          id: i,
          name: PLAYER_NAMES[i],
          score: calculatePlayerScore(i),
          colors: [i]
        });
      }
    }

    // Sort by score (excluding neutral)
    const playerScores = scores.filter(s => !s.isNeutral).sort((a, b) => b.score - a.score);
    const neutralScore = scores.find(s => s.isNeutral);

    return neutralScore ? [...playerScores, neutralScore] : playerScores;
  };

  const handleReset = () => {
    resetGame();
  };

  const handleBackToMenu = () => {
    resetGame();
    setGameStarted(false);
  };

  if (!gameStarted) {
    return <StartScreen onStartGame={handleStartGame} />;
  }

  return (
    <div className="App">
      {skippedNotification && (
        <div className="skipped-notification">
          <div className="skipped-content">
            <span className="skipped-icon">⏭️</span>
            <span className="skipped-text">
              {skippedNotification.length === 1
                ? `${skippedNotification[0]} has no valid moves - skipped!`
                : `${skippedNotification.join(' & ')} have no valid moves - skipped!`}
            </span>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
            <h2>Game Over!</h2>
            <div className="final-scores">
              {getFinalScores().map((player, index) => (
                <div
                  key={player.id}
                  className={`score-row ${index === 0 && !player.isNeutral ? 'winner' : ''} ${player.isNeutral ? 'neutral-row' : ''}`}
                >
                  <span className="rank">{player.isNeutral ? '-' : index + 1}</span>
                  <div className="player-colors">
                    {player.colors.map(colorId => (
                      <span
                        key={colorId}
                        className="player-dot"
                        style={{ backgroundColor: PLAYER_COLORS[colorId] }}
                      ></span>
                    ))}
                  </div>
                  <span className="player-name">{player.name}</span>
                  <span className="player-score">{player.score} pts</span>
                </div>
              ))}
            </div>
            <div className="modal-buttons">
              <button onClick={handleReset}>Play Again</button>
              <button onClick={handleBackToMenu} className="secondary">Main Menu</button>
            </div>
          </div>
        </div>
      )}

      <TopMenu
        currentPlayer={currentPlayer}
        usedPieces={usedPieces}
        playersOut={playersOut}
        onUndo={handleUndo}
        onPass={handlePass}
        onRestart={handleReset}
        onBackToMenu={handleBackToMenu}
        canUndo={canUndo}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        playerCount={playerCount}
        neutralTurnPlayer={neutralTurnPlayer}
        getCurrentPlayer={getCurrentPlayer}
        isNeutralColor={isNeutralColor}
      />

      <div className={`game-layout ${isMobile && selectedPiece ? 'mobile-placement-mode' : ''}`}>
        <div className="main-area">
          <Board
            board={board}
            selectedPiece={selectedPiece}
            currentPlayer={currentPlayer}
            firstMoves={firstMoves}
            onPlacePiece={handlePlacePiece}
            playerCount={playerCount}
            neutralTurnPlayer={neutralTurnPlayer}
            isNeutralColor={isNeutralColor}
            isMobile={isMobile}
            mobilePosition={mobilePosition}
            onMobilePositionChange={setMobilePosition}
          />
        </div>

        <div className="sidebar right-sidebar">
          {/* On mobile, show controls when piece is selected, otherwise show piece selector */}
          {isMobile && selectedPiece ? (
            <MobileControls
              selectedPiece={selectedPiece}
              currentPlayer={currentPlayer}
              position={mobilePosition}
              onMove={handleMobileMove}
              onRotate={handleMobileRotate}
              onFlip={handleMobileFlip}
              onPlace={handleMobilePlace}
              onCancel={handleMobileCancel}
              isValidPlacement={isMobilePlacementValid}
            />
          ) : (
            <PieceSelector
              currentPlayer={currentPlayer}
              usedPieces={usedPieces}
              selectedPiece={selectedPiece}
              onSelectPiece={handleSelectPiece}
              onRotate={handleRotate}
              onFlip={handleFlip}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
