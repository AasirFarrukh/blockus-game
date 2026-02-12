import React, { useState } from 'react';
import './StartScreen.css';

const StartScreen = ({ onStartGame }) => {
  const [step, setStep] = useState(0); // Wizard step
  const [gameMode, setGameMode] = useState(null); // 'friends' or 'cpu'
  const [playerCount, setPlayerCount] = useState(4);
  const [humanPlayerCount, setHumanPlayerCount] = useState(1);
  const [cpuDifficulty, setCpuDifficulty] = useState('medium');
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);

  // Ensure playerCount is valid when humanPlayerCount changes in CPU mode
  React.useEffect(() => {
    if (gameMode === 'cpu' && playerCount <= humanPlayerCount) {
      // Set to minimum valid player count (humanPlayerCount + 1)
      setPlayerCount(Math.max(humanPlayerCount + 1, 2));
    }
  }, [humanPlayerCount, gameMode, playerCount]);

  const handleStartGame = () => {
    // Build final config
    const config = {
      playerCount,
      gameMode: gameMode === 'cpu' ? 'cpu' : 'human',
      humanPlayerCount: gameMode === 'cpu' ? humanPlayerCount : playerCount,
      cpuDifficulty: gameMode === 'cpu' ? cpuDifficulty : null,
      playerNames: gameMode === 'friends' ? playerNames.slice(0, playerCount) : null
    };
    onStartGame(config);
  };

  const handlePlayerNameChange = (index, value) => {
    const newNames = [...playerNames];
    newNames[index] = value;
    setPlayerNames(newNames);
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

  const getDifficultyDescription = () => {
    switch (cpuDifficulty) {
      case 'easy':
        return 'Casual play - Random moves, quick decisions';
      case 'medium':
        return 'Balanced play - Tactical strategy, moderate thinking time';
      case 'hard':
        return 'Competitive play - Advanced strategy, calculates blocking moves';
      default:
        return '';
    }
  };

  // Step 0: Welcome screen with rules and controls
  const renderWelcomeStep = () => (
    <div className="wizard-step welcome-step">
      <div className="start-header">
        <img
          src="/blokusLogo.jpg"
          alt="Blokus Logo"
          className="start-logo"
        />
        <div className="start-header-text">
          <h1 className="start-title">BLOKUS</h1>
          <p className="start-subtitle">The Strategy Game of Territorial Domination</p>
        </div>
      </div>

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

      <button className="start-button" onClick={() => setStep(1)}>
        Start
      </button>
    </div>
  );

  // Step 1: Choose game mode
  const renderModeSelectionStep = () => (
    <div className="wizard-step mode-selection-step">
      <h2 className="step-title">Choose Game Mode</h2>
      <div className="game-mode-options">
        <button
          className="mode-btn large"
          onClick={() => {
            setGameMode('cpu');
            setStep(2);
          }}
        >
          <span className="mode-icon">🤖</span>
          <span className="mode-label">Play with CPU</span>
          <span className="mode-desc">Challenge the computer</span>
        </button>
        <button
          className="mode-btn large"
          onClick={() => {
            setGameMode('friends');
            setStep(2);
          }}
        >
          <span className="mode-icon">👥</span>
          <span className="mode-label">Play with Friends</span>
          <span className="mode-desc">Pass and play locally</span>
        </button>
      </div>
      <button className="back-button" onClick={() => setStep(0)}>
        ← Back
      </button>
    </div>
  );

  // Step 2: CPU path - Select number of human players
  const renderHumanCountStep = () => (
    <div className="wizard-step">
      <h2 className="step-title">How Many Human Players?</h2>
      <div className="player-count-options">
        {[1, 2, 3].map(count => (
          <button
            key={count}
            className={`player-count-btn ${humanPlayerCount === count ? 'active' : ''}`}
            onClick={() => setHumanPlayerCount(count)}
          >
            <span className="count-number">{count}</span>
            <span className="count-label">Player{count > 1 ? 's' : ''}</span>
          </button>
        ))}
      </div>
      <div className="wizard-buttons">
        <button className="back-button" onClick={() => setStep(1)}>
          ← Back
        </button>
        <button className="continue-button" onClick={() => setStep(3)}>
          Continue
        </button>
      </div>
    </div>
  );

  // Step 3: CPU path - Select total player count
  const renderCpuPlayerCountStep = () => {
    // Only show player counts where there's at least one CPU
    const validPlayerCounts = [2, 3, 4].filter(count => count > humanPlayerCount);
    const cpuCount = playerCount - humanPlayerCount;

    return (
      <div className="wizard-step">
        <h2 className="step-title">Game Mode</h2>
        <p className="step-description">
          {humanPlayerCount} Human{humanPlayerCount > 1 ? 's' : ''} vs {cpuCount} CPU
        </p>
        <div className="player-count-options">
          {validPlayerCounts.map(count => (
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
        <div className="wizard-buttons">
          <button className="back-button" onClick={() => setStep(2)}>
            ← Back
          </button>
          <button className="continue-button" onClick={() => setStep(4)}>
            Continue
          </button>
        </div>
      </div>
    );
  };

  // Step 4: CPU path - Select difficulty
  const renderDifficultyStep = () => (
    <div className="wizard-step">
      <h2 className="step-title">CPU Difficulty</h2>
      <div className="difficulty-options">
        <button
          className={`difficulty-btn easy ${cpuDifficulty === 'easy' ? 'active' : ''}`}
          onClick={() => setCpuDifficulty('easy')}
        >
          <span className="difficulty-icon">😊</span>
          <span className="difficulty-label">Easy</span>
        </button>
        <button
          className={`difficulty-btn medium ${cpuDifficulty === 'medium' ? 'active' : ''}`}
          onClick={() => setCpuDifficulty('medium')}
        >
          <span className="difficulty-icon">🤔</span>
          <span className="difficulty-label">Medium</span>
        </button>
        <button
          className={`difficulty-btn hard ${cpuDifficulty === 'hard' ? 'active' : ''}`}
          onClick={() => setCpuDifficulty('hard')}
        >
          <span className="difficulty-icon">🧠</span>
          <span className="difficulty-label">Hard</span>
        </button>
      </div>
      <p className="difficulty-description">{getDifficultyDescription()}</p>
      <div className="wizard-buttons">
        <button className="back-button" onClick={() => setStep(3)}>
          ← Back
        </button>
        <button className="start-button" onClick={handleStartGame}>
          Start Game
        </button>
      </div>
    </div>
  );

  // Step 2: Friends path - Select player count
  const renderFriendsPlayerCountStep = () => (
    <div className="wizard-step">
      <h2 className="step-title">How Many Players?</h2>
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
      <div className="wizard-buttons">
        <button className="back-button" onClick={() => setStep(1)}>
          ← Back
        </button>
        <button className="continue-button" onClick={() => setStep(3)}>
          Continue
        </button>
      </div>
    </div>
  );

  // Step 3: Friends path - Enter player names (optional)
  const renderPlayerNamesStep = () => {
    const colors = ['Blue', 'Red', 'Green', 'Yellow'];
    const displayCount = playerCount === 2 ? 2 : playerCount;

    return (
      <div className="wizard-step">
        <h2 className="step-title">Player Names (Optional)</h2>
        <p className="step-description">Leave blank to use default color names</p>
        <div className="player-names-form">
          {[...Array(displayCount)].map((_, index) => (
            <div key={index} className="name-input-group">
              <div className={`player-color ${colors[index].toLowerCase()}`}></div>
              <input
                type="text"
                placeholder={playerCount === 2 ? `Player ${index + 1}` : colors[index]}
                value={playerNames[index]}
                onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                className="name-input"
                maxLength={15}
              />
            </div>
          ))}
        </div>
        <div className="wizard-buttons">
          <button className="back-button" onClick={() => setStep(2)}>
            ← Back
          </button>
          <button className="start-button" onClick={handleStartGame}>
            Start Game
          </button>
        </div>
      </div>
    );
  };

  // Main render logic
  const renderCurrentStep = () => {
    if (step === 0) {
      return renderWelcomeStep();
    } else if (step === 1) {
      return renderModeSelectionStep();
    } else if (gameMode === 'cpu') {
      if (step === 2) return renderHumanCountStep();
      if (step === 3) return renderCpuPlayerCountStep();
      if (step === 4) return renderDifficultyStep();
    } else if (gameMode === 'friends') {
      if (step === 2) return renderFriendsPlayerCountStep();
      if (step === 3) return renderPlayerNamesStep();
    }
    return null;
  };

  return (
    <div className="start-screen">
      <div className="start-content">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default StartScreen;
