import React from 'react';
import './MobileControls.css';
import Piece from '../Piece/Piece';
import { PLAYER_COLORS } from '../../data/pieces';

const MobileControls = ({
  selectedPiece,
  currentPlayer,
  position,
  onMove,
  onRotate,
  onFlip,
  onPlace,
  onCancel,
  isValidPlacement
}) => {
  return (
    <div className="mobile-controls">
      {/* Selected piece preview */}
      <div className="mobile-piece-preview">
        <div className="preview-label">Selected Piece</div>
        <div className="preview-piece">
          <Piece
            shape={selectedPiece.shape}
            color={PLAYER_COLORS[currentPlayer]}
            pieceId={selectedPiece.id}
            isUsed={false}
            isSelected={true}
            onClick={() => {}}
          />
        </div>
      </div>

      {/* D-Pad Controls */}
      <div className="dpad-container">
        <button
          className="dpad-btn dpad-up"
          onClick={() => onMove('up')}
          aria-label="Move up"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4l-8 8h16l-8-8z"/>
          </svg>
        </button>
        <button
          className="dpad-btn dpad-left"
          onClick={() => onMove('left')}
          aria-label="Move left"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 12l8-8v16l-8-8z"/>
          </svg>
        </button>
        <div className="dpad-center">
          <span className="position-indicator">{position.row},{position.col}</span>
        </div>
        <button
          className="dpad-btn dpad-right"
          onClick={() => onMove('right')}
          aria-label="Move right"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 12l-8 8V4l8 8z"/>
          </svg>
        </button>
        <button
          className="dpad-btn dpad-down"
          onClick={() => onMove('down')}
          aria-label="Move down"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 20l8-8H4l8 8z"/>
          </svg>
        </button>
      </div>

      {/* Transform Controls */}
      <div className="transform-controls">
        <button className="transform-btn rotate-btn" onClick={onRotate}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M1 4v6h6M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          <span>Rotate</span>
        </button>
        <button className="transform-btn flip-btn" onClick={onFlip}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v20M4 6l4 4-4 4M20 6l-4 4 4 4"/>
          </svg>
          <span>Flip</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="action-controls">
        <button
          className={`action-btn place-btn ${isValidPlacement ? 'valid' : 'invalid'}`}
          onClick={onPlace}
          disabled={!isValidPlacement}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <span>Place</span>
        </button>
        <button className="action-btn cancel-btn" onClick={onCancel}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
};

export default MobileControls;
