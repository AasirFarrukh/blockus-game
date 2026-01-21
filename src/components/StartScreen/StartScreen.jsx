import React, { useState } from 'react';
import './StartScreen.css';

const StartScreen = ({ onStartGame }) => {
  const [playerCount, setPlayerCount] = useState(4);

  const handleStartGame = () => {
    onStartGame(playerCount);
  };

  const getModeDescription = () => {
    switch (playerCount) {
      case 2:
        return 'Each player controls 2 colors (diagonal corners)';
      case 3:
        return '3 players + 1 neutral color (Yellow)';
      case 4:
        return 'Classic mode - each player controls 1 color';
      default:
        return '';
    }
  };

  return (
    <div className="start-screen">
      <div className="start-content">
        <h1 className="start-title">BLOKUS</h1>
        <p className="start-subtitle">The Strategy Game of Territorial Domination</p>

        <div className="instructions-container">
          <div className="instruction-section">
            <h2>How to Play</h2>
            <div className="instruction-grid">
              <div className="instruction-card">
                <div className="instruction-number">1</div>
                <h3>Start at Your Corner</h3>
                <p>Each player starts from their assigned corner. Your first piece must cover your corner square.</p>
              </div>
              <div className="instruction-card">
                <div className="instruction-number">2</div>
                <h3>Corner to Corner</h3>
                <p>Each new piece must touch at least one corner of your previously placed pieces.</p>
              </div>
              <div className="instruction-card">
                <div className="instruction-number">3</div>
                <h3>No Edge Contact</h3>
                <p>Your pieces cannot share edges with your own pieces, but can touch opponents' pieces anywhere.</p>
              </div>
              <div className="instruction-card">
                <div className="instruction-number">4</div>
                <h3>Score Points</h3>
                <p>Place as many squares as possible. Each square on the board is worth 1 point!</p>
              </div>
            </div>
          </div>

          <div className="controls-section">
            <h2>Controls</h2>
            <div className="controls-grid">
              <div className="control-item">
                <span className="control-key">Click</span>
                <span className="control-desc">Select piece / Place on board</span>
              </div>
              <div className="control-item">
                <span className="control-key">Left / Right</span>
                <span className="control-desc">Rotate piece</span>
              </div>
              <div className="control-item">
                <span className="control-key">Up / Down</span>
                <span className="control-desc">Flip piece</span>
              </div>
            </div>
          </div>

          <div className="player-count-section">
            <h2>Number of Players</h2>
            <div className="player-count-options">
              {[2, 3, 4].map(count => (
                <button
                  key={count}
                  className={`player-count-btn ${playerCount === count ? 'active' : ''}`}
                  onClick={() => setPlayerCount(count)}
                >
                  <span className="count-number">{count}</span>
                  <span className="count-label">Players</span>
                </button>
              ))}
            </div>
            <p className="mode-description">{getModeDescription()}</p>
            <div className="players-preview">
              {playerCount === 2 && (
                <>
                  <div className="player-group">
                    <div className="player-color blue"></div>
                    <div className="player-color green"></div>
                    <span>P1</span>
                  </div>
                  <span className="vs">vs</span>
                  <div className="player-group">
                    <div className="player-color red"></div>
                    <div className="player-color yellow"></div>
                    <span>P2</span>
                  </div>
                </>
              )}
              {playerCount === 3 && (
                <>
                  <div className="player-color blue"></div>
                  <div className="player-color red"></div>
                  <div className="player-color green"></div>
                  <div className="player-color yellow neutral"></div>
                  <span>+ Neutral</span>
                </>
              )}
              {playerCount === 4 && (
                <>
                  <div className="player-color blue"></div>
                  <div className="player-color red"></div>
                  <div className="player-color green"></div>
                  <div className="player-color yellow"></div>
                  <span>4 Players</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button className="start-button" onClick={handleStartGame}>
          Start Game
        </button>
      </div>
    </div>
  );
};

export default StartScreen;
