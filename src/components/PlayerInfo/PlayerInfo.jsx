import React from 'react';
import './PlayerInfo.css';
import { PLAYER_COLORS, PLAYER_NAMES, PIECE_SHAPES } from '../../data/pieces';

const PlayerInfo = ({ currentPlayer, usedPieces, playersOut = {} }) => {
  const calculateScore = (playerId) => {
    const used = usedPieces[playerId];
    return used.reduce((total, pieceId) => {
      const shape = PIECE_SHAPES[pieceId];
      const squares = shape.flat().filter(cell => cell === 1).length;
      return total + squares;
    }, 0);
  };

  const remainingPieces = (playerId) => {
    return Object.keys(PIECE_SHAPES).length - usedPieces[playerId].length;
  };

  return (
    <div className="player-info">
      <h2>Game Status</h2>

      <div className="current-player" style={{ borderColor: PLAYER_COLORS[currentPlayer] }}>
        <h3>Current Turn</h3>
        <div className="player-name" style={{ color: PLAYER_COLORS[currentPlayer] }}>
          {PLAYER_NAMES[currentPlayer]}
        </div>
      </div>

      <div className="players-list">
        {[0, 1, 2, 3].map(playerId => (
          <div
            key={playerId}
            className={`player-card ${playerId === currentPlayer ? 'active' : ''} ${playersOut[playerId] ? 'out' : ''}`}
            style={{ borderLeftColor: PLAYER_COLORS[playerId] }}
          >
            <div className="player-card-header">
              <span className="player-indicator" style={{ backgroundColor: PLAYER_COLORS[playerId] }} />
              <span className="player-card-name">
                {PLAYER_NAMES[playerId]}
                {playersOut[playerId] && <span className="out-badge">OUT</span>}
              </span>
            </div>
            <div className="player-stats">
              <div className="stat">
                <span className="stat-label">Score</span>
                <span className="stat-value">{calculateScore(playerId)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Pieces</span>
                <span className="stat-value">{remainingPieces(playerId)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerInfo;
