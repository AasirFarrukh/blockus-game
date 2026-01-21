import React from 'react';
import './GameControls.css';

const GameControls = ({ onUndo, onEndGame, onBackToMenu, canUndo }) => {
  return (
    <div className="game-controls">
      <div className="controls-buttons">
        <button
          className={`control-btn undo-btn ${!canUndo ? 'disabled' : ''}`}
          onClick={onUndo}
          disabled={!canUndo}
        >
          Undo
        </button>
        <button className="control-btn end-btn" onClick={onEndGame}>
          End Game
        </button>
        <button className="control-btn menu-btn" onClick={onBackToMenu}>
          Main Menu
        </button>
      </div>

      <div className="controls-help">
        <span className="help-item">
          <span className="key">Click</span> Select/Place
        </span>
        <span className="help-item">
          <span className="key">Arrows</span> Rotate/Flip
        </span>
        <span className="help-item">
          <span className="key">Esc</span> Deselect
        </span>
      </div>
    </div>
  );
};

export default GameControls;
