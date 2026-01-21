import React, { useState, useEffect, useCallback } from 'react';
import './PieceSelector.css';
import Piece from '../Piece/Piece';
import { PIECE_SHAPES, PLAYER_COLORS } from '../../data/pieces';
import { rotatePiece, flipPiece } from '../../utils/gameLogic';

const PieceSelector = ({ currentPlayer, usedPieces, selectedPiece, onSelectPiece, onRotate, onFlip }) => {
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Reset rotation/flip when piece changes or player changes
  useEffect(() => {
    if (!selectedPiece) {
      setRotation(0);
      setFlipped(false);
    }
  }, [selectedPiece, currentPlayer]);

  const handlePieceClick = (pieceId, shape) => {
    if (usedPieces[currentPlayer].includes(pieceId)) {
      return;
    }

    // Reset transformations when selecting a new piece
    setRotation(0);
    setFlipped(false);

    onSelectPiece({ id: pieceId, shape: shape, originalShape: shape });
  };

  const handleRotate = () => {
    if (!selectedPiece) return;

    const newRotation = (rotation + 1) % 4;
    setRotation(newRotation);

    let transformedShape = selectedPiece.originalShape;
    if (flipped) {
      transformedShape = flipPiece(transformedShape);
    }
    for (let i = 0; i < newRotation; i++) {
      transformedShape = rotatePiece(transformedShape);
    }

    onSelectPiece({
      ...selectedPiece,
      shape: transformedShape
    });

    if (onRotate) onRotate();
  };

  const handleFlip = () => {
    if (!selectedPiece) return;

    const newFlipped = !flipped;
    setFlipped(newFlipped);

    let transformedShape = selectedPiece.originalShape;
    if (newFlipped) {
      transformedShape = flipPiece(transformedShape);
    }
    for (let i = 0; i < rotation; i++) {
      transformedShape = rotatePiece(transformedShape);
    }

    onSelectPiece({
      ...selectedPiece,
      shape: transformedShape
    });

    if (onFlip) onFlip();
  };

  const handleDeselect = () => {
    onSelectPiece(null);
    setRotation(0);
    setFlipped(false);
  };

  // Keyboard event handler for arrow keys
  const handleKeyDown = useCallback((e) => {
    if (!selectedPiece) return;

    // Left/Right arrows for rotation
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const direction = e.key === 'ArrowRight' ? 1 : 3;
      const newRotation = (rotation + direction) % 4;
      setRotation(newRotation);

      let transformedShape = selectedPiece.originalShape;
      if (flipped) {
        transformedShape = flipPiece(transformedShape);
      }
      for (let i = 0; i < newRotation; i++) {
        transformedShape = rotatePiece(transformedShape);
      }
      onSelectPiece({
        ...selectedPiece,
        shape: transformedShape
      });

      if (onRotate) onRotate();
    }

    // Up/Down arrows for flip
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const newFlipped = !flipped;
      setFlipped(newFlipped);

      let transformedShape = selectedPiece.originalShape;
      if (newFlipped) {
        transformedShape = flipPiece(transformedShape);
      }
      for (let i = 0; i < rotation; i++) {
        transformedShape = rotatePiece(transformedShape);
      }
      onSelectPiece({
        ...selectedPiece,
        shape: transformedShape
      });

      if (onFlip) onFlip();
    }
  }, [selectedPiece, rotation, flipped, onSelectPiece, onRotate, onFlip]);

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="piece-selector">
      <h3>Pieces</h3>

      {selectedPiece && (
        <div className="piece-controls">
          <div className="piece-controls-buttons">
            <button onClick={handleRotate}>Rotate</button>
            <button onClick={handleFlip}>Flip</button>
            <button onClick={handleDeselect}>Deselect</button>
          </div>
          <div className="rotation-info">
            {rotation * 90}° {flipped ? '| Flipped' : ''}
          </div>
          <div className="keyboard-hints">
            <span className="hint"><kbd>←</kbd><kbd>→</kbd> Rotate</span>
            <span className="hint"><kbd>↑</kbd><kbd>↓</kbd> Flip</span>
            <span className="hint"><kbd>Esc</kbd> Deselect</span>
          </div>
        </div>
      )}

      <div className="pieces-grid">
        {Object.entries(PIECE_SHAPES).map(([pieceId, shape]) => (
          <Piece
            key={pieceId}
            shape={shape}
            color={PLAYER_COLORS[currentPlayer]}
            pieceId={pieceId}
            isUsed={usedPieces[currentPlayer].includes(pieceId)}
            isSelected={selectedPiece?.id === pieceId}
            onClick={() => handlePieceClick(pieceId, shape)}
          />
        ))}
      </div>
    </div>
  );
};

export default PieceSelector;
