import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Board from './components/Board/Board';
import PieceSelector from './components/PieceSelector/PieceSelector';
import TopMenu from './components/TopMenu/TopMenu';
import StartScreen from './components/StartScreen/StartScreen';
import { useGameState } from './hooks/useGameState';
import { PLAYER_NAMES, PIECE_SHAPES, PLAYER_MODES, PLAYER_COLORS } from './data/pieces';

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

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPlayerCount, setSelectedPlayerCount] = useState(4);

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
    setGameOver,
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
    } else if (result && !result.success) {
      if (sounds && soundEnabled) sounds.invalid();
    }
    return result;
  };

  const handleSelectPiece = (piece) => {
    if (piece && sounds && soundEnabled) sounds.select();
    else if (!piece && sounds && soundEnabled) sounds.deselect();
    setSelectedPiece(piece);
  };

  const handleRotate = useCallback(() => {
    if (sounds && soundEnabled) sounds.rotate();
  }, [soundEnabled]);

  const handleFlip = useCallback(() => {
    if (sounds && soundEnabled) sounds.flip();
  }, [soundEnabled]);

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

      <div className="game-layout">
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
          />
        </div>

        <div className="sidebar right-sidebar">
          <PieceSelector
            currentPlayer={currentPlayer}
            usedPieces={usedPieces}
            selectedPiece={selectedPiece}
            onSelectPiece={handleSelectPiece}
            onRotate={handleRotate}
            onFlip={handleFlip}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
