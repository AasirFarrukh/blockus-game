import React, { useState, useEffect } from 'react';
import './TopMenu.css';
import { PLAYER_COLORS, PIECE_SHAPES, PLAYER_MODES, COLOR_NAMES } from '../../data/pieces';

const TopMenu = ({
  currentPlayer,
  usedPieces,
  playersOut,
  onUndo,
  onPass,
  onRestart,
  onBackToMenu,
  canUndo,
  soundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
  playerCount = 4,
  neutralTurnPlayer = 0,
  getCurrentPlayer,
  isNeutralColor
}) => {
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Close pause menu with Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isPauseOpen) {
        if (showInstructions) {
          setShowInstructions(false);
        } else {
          setIsPauseOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPauseOpen, showInstructions]);

  const handleClosePause = () => {
    setIsPauseOpen(false);
    setShowInstructions(false);
  };

  const handlePauseClick = () => {
    setIsPauseOpen(!isPauseOpen);
  };

  const handleRestart = () => {
    handleClosePause();
    onRestart();
  };

  const handleBackToMenu = () => {
    handleClosePause();
    onBackToMenu();
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

  // Calculate combined score for a player in their mode
  const calculatePlayerScore = (playerId) => {
    const mode = PLAYER_MODES[playerCount];
    const colors = mode.playerColors[playerId];
    return colors.reduce((total, colorId) => total + calculateColorScore(colorId), 0);
  };

  const remainingPiecesForColor = (colorId) => {
    return Object.keys(PIECE_SHAPES).length - usedPieces[colorId].length;
  };

  const remainingPiecesForPlayer = (playerId) => {
    const mode = PLAYER_MODES[playerCount];
    const colors = mode.playerColors[playerId];
    return colors.reduce((total, colorId) => total + remainingPiecesForColor(colorId), 0);
  };

  const totalPieces = Object.keys(PIECE_SHAPES).length;

  const getPieceProgressForPlayer = (playerId) => {
    const mode = PLAYER_MODES[playerCount];
    const colors = mode.playerColors[playerId];
    const totalForPlayer = totalPieces * colors.length;
    const used = colors.reduce((total, colorId) => total + usedPieces[colorId].length, 0);
    return (used / totalForPlayer) * 100;
  };

  // Check if a player is currently active (their turn)
  const isPlayerActive = (playerId) => {
    const mode = PLAYER_MODES[playerCount];
    if (playerCount === 3 && isNeutralColor && isNeutralColor(currentPlayer)) {
      return playerId === neutralTurnPlayer;
    }
    return mode.colorToPlayer[currentPlayer] === playerId;
  };

  // Check if a player is out (all their colors are out)
  const isPlayerOut = (playerId) => {
    const mode = PLAYER_MODES[playerCount];
    const colors = mode.playerColors[playerId];
    return colors.every(colorId => playersOut[colorId]);
  };

  // Render player cards based on player count
  const renderPlayerCards = () => {
    const mode = PLAYER_MODES[playerCount];

    if (playerCount === 4) {
      // 4-player mode: show all 4 colors as separate players
      return [0, 1, 2, 3].map(colorId => (
        <div
          key={colorId}
          className={`player-score-card ${colorId === currentPlayer ? 'active' : ''} ${playersOut[colorId] ? 'out' : ''}`}
          style={{
            '--player-color': PLAYER_COLORS[colorId],
            borderColor: colorId === currentPlayer ? PLAYER_COLORS[colorId] : 'transparent'
          }}
        >
          <div className="player-score-header">
            <span
              className="player-color-dot"
              style={{ backgroundColor: PLAYER_COLORS[colorId] }}
            />
            <span className="player-score-name">
              {COLOR_NAMES[colorId]}
              {playersOut[colorId] && <span className="out-badge">OUT</span>}
            </span>
          </div>
          <div className="player-score-stats">
            <div className="score-stat">
              <span className="score-value">{calculateColorScore(colorId)}</span>
              <span className="score-label">pts</span>
            </div>
            <div className="score-stat pieces">
              <span className="score-value">{remainingPiecesForColor(colorId)}</span>
              <span className="score-label">left</span>
            </div>
          </div>
          <div className="piece-progress-bar">
            <div
              className="piece-progress-fill"
              style={{
                width: `${(usedPieces[colorId].length / totalPieces) * 100}%`,
                backgroundColor: PLAYER_COLORS[colorId]
              }}
            />
          </div>
        </div>
      ));
    }

    if (playerCount === 2) {
      // 2-player mode: show 2 players with their combined colors
      return [0, 1].map(playerId => {
        const colors = mode.playerColors[playerId];
        const isActive = isPlayerActive(playerId);
        const isOut = isPlayerOut(playerId);

        return (
          <div
            key={playerId}
            className={`player-score-card ${isActive ? 'active' : ''} ${isOut ? 'out' : ''}`}
            style={{
              '--player-color': PLAYER_COLORS[colors[0]],
              borderColor: isActive ? PLAYER_COLORS[currentPlayer] : 'transparent'
            }}
          >
            <div className="player-score-header">
              <div className="player-color-dots">
                {colors.map(colorId => (
                  <span
                    key={colorId}
                    className={`player-color-dot ${colorId === currentPlayer ? 'current' : ''}`}
                    style={{ backgroundColor: PLAYER_COLORS[colorId] }}
                  />
                ))}
              </div>
              <span className="player-score-name">
                Player {playerId + 1}
                {isOut && <span className="out-badge">OUT</span>}
              </span>
            </div>
            <div className="player-score-stats">
              <div className="score-stat">
                <span className="score-value">{calculatePlayerScore(playerId)}</span>
                <span className="score-label">pts</span>
              </div>
              <div className="score-stat pieces">
                <span className="score-value">{remainingPiecesForPlayer(playerId)}</span>
                <span className="score-label">left</span>
              </div>
            </div>
            <div className="piece-progress-bar">
              <div
                className="piece-progress-fill"
                style={{
                  width: `${getPieceProgressForPlayer(playerId)}%`,
                  background: `linear-gradient(90deg, ${PLAYER_COLORS[colors[0]]} 50%, ${PLAYER_COLORS[colors[1]]} 50%)`
                }}
              />
            </div>
          </div>
        );
      });
    }

    if (playerCount === 3) {
      // 3-player mode: show 3 players + neutral
      const cards = [];

      // Regular players
      for (let playerId = 0; playerId < 3; playerId++) {
        const colorId = playerId;
        const isActive = isPlayerActive(playerId);
        const isOut = playersOut[colorId];

        cards.push(
          <div
            key={playerId}
            className={`player-score-card ${isActive ? 'active' : ''} ${isOut ? 'out' : ''}`}
            style={{
              '--player-color': PLAYER_COLORS[colorId],
              borderColor: isActive ? PLAYER_COLORS[colorId] : 'transparent'
            }}
          >
            <div className="player-score-header">
              <span
                className="player-color-dot"
                style={{ backgroundColor: PLAYER_COLORS[colorId] }}
              />
              <span className="player-score-name">
                Player {playerId + 1}
                {isOut && <span className="out-badge">OUT</span>}
              </span>
            </div>
            <div className="player-score-stats">
              <div className="score-stat">
                <span className="score-value">{calculateColorScore(colorId)}</span>
                <span className="score-label">pts</span>
              </div>
              <div className="score-stat pieces">
                <span className="score-value">{remainingPiecesForColor(colorId)}</span>
                <span className="score-label">left</span>
              </div>
            </div>
            <div className="piece-progress-bar">
              <div
                className="piece-progress-fill"
                style={{
                  width: `${(usedPieces[colorId].length / totalPieces) * 100}%`,
                  backgroundColor: PLAYER_COLORS[colorId]
                }}
              />
            </div>
          </div>
        );
      }

      // Neutral color card
      const neutralColorId = mode.neutralColor;
      const isNeutralActive = currentPlayer === neutralColorId;
      const isNeutralOut = playersOut[neutralColorId];

      cards.push(
        <div
          key="neutral"
          className={`player-score-card neutral-card ${isNeutralActive ? 'active' : ''} ${isNeutralOut ? 'out' : ''}`}
          style={{
            '--player-color': PLAYER_COLORS[neutralColorId],
            borderColor: isNeutralActive ? PLAYER_COLORS[neutralColorId] : 'transparent'
          }}
        >
          <div className="player-score-header">
            <span
              className="player-color-dot"
              style={{ backgroundColor: PLAYER_COLORS[neutralColorId] }}
            />
            <span className="player-score-name">
              Neutral
              {isNeutralActive && <span className="neutral-player-badge">P{neutralTurnPlayer + 1}</span>}
              {isNeutralOut && <span className="out-badge">OUT</span>}
            </span>
          </div>
          <div className="player-score-stats">
            <div className="score-stat">
              <span className="score-value">{calculateColorScore(neutralColorId)}</span>
              <span className="score-label">pts</span>
            </div>
            <div className="score-stat pieces">
              <span className="score-value">{remainingPiecesForColor(neutralColorId)}</span>
              <span className="score-label">left</span>
            </div>
          </div>
          <div className="piece-progress-bar">
            <div
              className="piece-progress-fill"
              style={{
                width: `${(usedPieces[neutralColorId].length / totalPieces) * 100}%`,
                backgroundColor: PLAYER_COLORS[neutralColorId]
              }}
            />
          </div>
        </div>
      );

      return cards;
    }

    return null;
  };

  return (
    <div className="top-menu">
      {/* Player Scores Section */}
      <div className="top-menu-scores">
        {renderPlayerCards()}
      </div>

      {/* Action Buttons Section */}
      <div className="top-menu-actions">
        <button
          className={`menu-btn undo-btn ${!canUndo ? 'disabled' : ''}`}
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo last move"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
          </svg>
          <span>Undo</span>
        </button>

        <button
          className="menu-btn pass-btn"
          onClick={onPass}
          title="Pass your turn"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
          <span>Pass</span>
        </button>

        <div className="menu-divider"></div>

        <button
          className={`menu-btn icon-btn ${soundEnabled ? '' : 'muted'}`}
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
        >
          {soundEnabled ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          )}
        </button>

        <button
          className="menu-btn icon-btn"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          )}
        </button>

        <div className="menu-divider"></div>

        <button
          className={`menu-btn pause-btn ${isPauseOpen ? 'active' : ''}`}
          onClick={handlePauseClick}
          title="Game menu"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
          <span>Pause</span>
        </button>

        {isPauseOpen && (
          <div className="pause-overlay" onClick={handleClosePause}>
            <div className={`pause-modal ${showInstructions ? 'instructions-view' : ''}`} onClick={(e) => e.stopPropagation()}>
              {!showInstructions ? (
                <>
                  <div className="pause-modal-header">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                    <h2>Game Paused</h2>
                  </div>
                  <div className="pause-modal-buttons">
                    <button className="pause-modal-btn resume" onClick={handleClosePause}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <span>Resume</span>
                    </button>
                    <button className="pause-modal-btn instructions" onClick={() => setShowInstructions(true)}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
                      </svg>
                      <span>Instructions</span>
                    </button>
                    <button className="pause-modal-btn restart" onClick={handleRestart}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                      </svg>
                      <span>Restart Game</span>
                    </button>
                    <button className="pause-modal-btn home" onClick={handleBackToMenu}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                      </svg>
                      <span>Main Menu</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="pause-modal-header">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                      <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
                    </svg>
                    <h2>How to Play</h2>
                  </div>
                  <div className="instructions-content">
                    <div className="instruction-item">
                      <div className="instruction-num">1</div>
                      <div className="instruction-text">
                        <strong>Start at Your Corner</strong>
                        <p>Your first piece must cover your assigned corner square.</p>
                      </div>
                    </div>
                    <div className="instruction-item">
                      <div className="instruction-num">2</div>
                      <div className="instruction-text">
                        <strong>Corner to Corner</strong>
                        <p>New pieces must touch a corner of your existing pieces.</p>
                      </div>
                    </div>
                    <div className="instruction-item">
                      <div className="instruction-num">3</div>
                      <div className="instruction-text">
                        <strong>No Edge Contact</strong>
                        <p>Your pieces cannot share edges with your own pieces.</p>
                      </div>
                    </div>
                    <div className="instruction-item">
                      <div className="instruction-num">4</div>
                      <div className="instruction-text">
                        <strong>Score Points</strong>
                        <p>Each square placed on the board is worth 1 point!</p>
                      </div>
                    </div>
                    <div className="controls-info">
                      <div className="control-hint"><span>Click</span> Select/Place</div>
                      <div className="control-hint"><span>← →</span> Rotate</div>
                      <div className="control-hint"><span>↑ ↓</span> Flip</div>
                    </div>
                  </div>
                  <button className="pause-modal-btn back" onClick={() => setShowInstructions(false)}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                    <span>Back</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopMenu;
