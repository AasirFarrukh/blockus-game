import React from 'react';
import './Piece.css';

const Piece = ({ shape, color, pieceId, isUsed, isSelected, onClick }) => {
  return (
    <div
      className={`piece-container ${isUsed ? 'used' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="piece-grid">
        {shape.map((row, rowIndex) => (
          <div key={rowIndex} className="piece-row">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`piece-cell ${cell === 1 ? 'filled' : 'empty'}`}
                style={{
                  backgroundColor: cell === 1 ? color : 'transparent'
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Piece;
