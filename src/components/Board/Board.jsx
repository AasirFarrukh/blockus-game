import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import './Board.css';
import { PLAYER_COLORS, COLOR_NAMES, PLAYER_MODES } from '../../data/pieces';
import { isValidPlacement } from '../../utils/validation';

const Board = ({
  board,
  selectedPiece,
  currentPlayer,
  firstMoves,
  onPlacePiece,
  playerCount = 4,
  neutralTurnPlayer = 0,
  isNeutralColor,
  isMobile = false,
  mobilePosition = null,
  onMobilePositionChange = null,
  playerNames = null,
  hintMove = null,
  hintAnimating = false
}) => {
  const [hoverPosition, setHoverPosition] = useState(null);
  const [toast, setToast] = useState(null);
  const [placedCells, setPlacedCells] = useState([]);

  // Swipe gesture state
  const touchStartRef = useRef(null);
  const lastMoveTimeRef = useRef(0);

  // Use mobile position if in mobile mode, otherwise use hover position
  const activePosition = isMobile && selectedPiece ? mobilePosition : hoverPosition;

  // Handle swipe gesture for mobile
  const handleTouchStart = useCallback((e) => {
    if (!isMobile || !selectedPiece) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }, [isMobile, selectedPiece]);

  const handleTouchMove = useCallback((e) => {
    if (!isMobile || !selectedPiece || !touchStartRef.current || !onMobilePositionChange) return;

    // Prevent scrolling while swiping on the board
    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Minimum swipe distance threshold (in pixels)
    const threshold = 25;
    const now = Date.now();

    // Throttle moves to prevent too rapid movement (100ms between moves)
    if (now - lastMoveTimeRef.current < 100) return;

    let moved = false;

    if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
      // Determine primary direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > threshold) {
          onMobilePositionChange(prev => ({
            ...prev,
            col: Math.min(19, prev.col + 1)
          }));
          moved = true;
        } else if (deltaX < -threshold) {
          onMobilePositionChange(prev => ({
            ...prev,
            col: Math.max(0, prev.col - 1)
          }));
          moved = true;
        }
      } else {
        // Vertical swipe
        if (deltaY > threshold) {
          onMobilePositionChange(prev => ({
            ...prev,
            row: Math.min(19, prev.row + 1)
          }));
          moved = true;
        } else if (deltaY < -threshold) {
          onMobilePositionChange(prev => ({
            ...prev,
            row: Math.max(0, prev.row - 1)
          }));
          moved = true;
        }
      }

      if (moved) {
        // Reset start position for continuous swiping
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: now
        };
        lastMoveTimeRef.current = now;
      }
    }
  }, [isMobile, selectedPiece, onMobilePositionChange]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  // Calculate the center offset of the shape
  const shapeCenter = useMemo(() => {
    if (!selectedPiece) return { rowOffset: 0, colOffset: 0 };

    const { shape } = selectedPiece;
    const height = shape.length;
    const width = shape[0].length;

    // Find all filled cells to calculate true center
    const filledCells = [];
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (shape[r][c] === 1) {
          filledCells.push({ r, c });
        }
      }
    }

    // Calculate center of mass of filled cells
    const avgRow = filledCells.reduce((sum, cell) => sum + cell.r, 0) / filledCells.length;
    const avgCol = filledCells.reduce((sum, cell) => sum + cell.c, 0) / filledCells.length;

    return {
      rowOffset: Math.floor(avgRow),
      colOffset: Math.floor(avgCol)
    };
  }, [selectedPiece]);

  // Check if current preview position is valid
  const previewValid = useMemo(() => {
    if (!activePosition || !selectedPiece) return false;

    const placementRow = activePosition.row - shapeCenter.rowOffset;
    const placementCol = activePosition.col - shapeCenter.colOffset;

    const result = isValidPlacement(
      board,
      placementRow,
      placementCol,
      selectedPiece.shape,
      currentPlayer,
      firstMoves[currentPlayer]
    );

    return result.valid;
  }, [activePosition, selectedPiece, board, currentPlayer, firstMoves, shapeCenter]);

  // Show toast notification
  const showToast = (message) => {
    setToast(message);
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Clear placed cells animation
  useEffect(() => {
    if (placedCells.length > 0) {
      const timer = setTimeout(() => {
        setPlacedCells([]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [placedCells]);

  const handleCellClick = (row, col) => {
    if (selectedPiece) {
      // On mobile, tapping a cell moves the piece to that position
      if (isMobile && onMobilePositionChange) {
        onMobilePositionChange({ row, col });
        return;
      }

      // On desktop, clicking places the piece
      const placementRow = row - shapeCenter.rowOffset;
      const placementCol = col - shapeCenter.colOffset;
      const result = onPlacePiece(placementRow, placementCol, selectedPiece.shape, selectedPiece.id);

      if (result && !result.success && result.reason) {
        showToast(result.reason);
      } else if (result && result.success) {
        // Trigger placement animation
        const cells = [];
        const { shape } = selectedPiece;
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[0].length; c++) {
            if (shape[r][c] === 1) {
              cells.push(`${placementRow + r}-${placementCol + c}`);
            }
          }
        }
        setPlacedCells(cells);
      }
    }
  };

  const handleCellHover = (row, col) => {
    if (selectedPiece) {
      setHoverPosition({ row, col });
    }
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
  };

  // Check if a cell should show preview (centered on cursor or mobile position)
  const isPreviewCell = (row, col) => {
    if (!activePosition || !selectedPiece) return false;

    const { row: activeRow, col: activeCol } = activePosition;
    const { shape } = selectedPiece;

    // Adjust for center offset - the active position should be the center of the shape
    const shapeStartRow = activeRow - shapeCenter.rowOffset;
    const shapeStartCol = activeCol - shapeCenter.colOffset;

    const relativeRow = row - shapeStartRow;
    const relativeCol = col - shapeStartCol;

    if (relativeRow >= 0 && relativeRow < shape.length &&
        relativeCol >= 0 && relativeCol < shape[0].length) {
      return shape[relativeRow][relativeCol] === 1;
    }

    return false;
  };

  // Get player display name
  const getPlayerDisplayName = (playerId) => {
    // Check if custom names are provided and this player has a custom name
    if (playerNames && playerNames[playerId] && playerNames[playerId].trim()) {
      return playerNames[playerId].trim();
    }

    // Otherwise use default names based on mode
    if (playerCount === 2 || playerCount === 3) {
      return `Player ${playerId + 1}`;
    } else {
      // For 4-player mode, use color names as default if no custom name
      return COLOR_NAMES[playerId];
    }
  };

  // Get the banner text based on player mode
  const getBannerText = () => {
    if (playerCount === 3 && isNeutralColor && isNeutralColor(currentPlayer)) {
      return `${getPlayerDisplayName(neutralTurnPlayer)} plays ${COLOR_NAMES[currentPlayer]} (Neutral)`;
    }
    if (playerCount === 2) {
      const mode = PLAYER_MODES[2];
      const playerId = mode.colorToPlayer[currentPlayer];
      return `${getPlayerDisplayName(playerId)} - ${COLOR_NAMES[currentPlayer]}'s Turn`;
    }
    return `${getPlayerDisplayName(currentPlayer)}'s Turn`;
  };

  // Render corner markers for first moves (only show if color hasn't placed first piece)
  const renderCornerMarker = (row, col) => {
    // Corners map to colors (not players)
    const corners = [
      { r: 0, c: 0, colorId: 0 },      // Blue - top left
      { r: 0, c: 19, colorId: 1 },     // Red - top right
      { r: 19, c: 19, colorId: 2 },    // Green - bottom right
      { r: 19, c: 0, colorId: 3 }      // Yellow - bottom left
    ];

    const corner = corners.find(c => c.r === row && c.c === col);

    // Only show marker if color hasn't made their first move and cell is empty
    if (corner && firstMoves[corner.colorId] && board[row][col] === null) {
      const isCurrentColor = corner.colorId === currentPlayer;
      const isNeutral = playerCount === 3 && corner.colorId === PLAYER_MODES[3].neutralColor;

      return (
        <div
          className={`corner-marker ${isCurrentColor ? 'active' : ''} ${isNeutral ? 'neutral' : ''}`}
          style={{
            backgroundColor: PLAYER_COLORS[corner.colorId],
            opacity: isCurrentColor ? 1 : 0.5
          }}
        />
      );
    }
    return null;
  };

  return (
    <div className="board-container">
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
      <div
        className={`current-player-banner ${playerCount === 3 && isNeutralColor && isNeutralColor(currentPlayer) ? 'neutral' : ''}`}
        style={{ backgroundColor: PLAYER_COLORS[currentPlayer] }}
        key={`${currentPlayer}-${neutralTurnPlayer}`}
      >
        <span className="banner-text">{getBannerText()}</span>
      </div>
      {isMobile && selectedPiece && (
        <div className="mobile-hint">
          Swipe or tap to move piece
        </div>
      )}
      <div
        className="board"
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, colIndex) => {
              const isPreview = isPreviewCell(rowIndex, colIndex);
              const isJustPlaced = placedCells.includes(`${rowIndex}-${colIndex}`);
              const cellKey = `${rowIndex}-${colIndex}`;

              // Check if this cell is part of the hint
              const isHintCell = hintAnimating && hintMove && (() => {
                const { row: hintRow, col: hintCol, shape } = hintMove;
                for (let r = 0; r < shape.length; r++) {
                  for (let c = 0; c < shape[0].length; c++) {
                    if (shape[r][c] === 1 && hintRow + r === rowIndex && hintCol + c === colIndex) {
                      return true;
                    }
                  }
                }
                return false;
              })();

              return (
                <div
                  key={cellKey}
                  className={`board-cell ${cell !== null ? 'filled' : ''} ${
                    isPreview ? (previewValid ? 'preview valid' : 'preview invalid') : ''
                  } ${isJustPlaced ? 'just-placed' : ''} ${isHintCell ? 'hint-cell' : ''}`}
                  style={{
                    backgroundColor: cell !== null
                      ? PLAYER_COLORS[cell]
                      : isPreview
                      ? previewValid
                        ? `${PLAYER_COLORS[currentPlayer]}99`
                        : 'rgba(213, 43, 30, 0.5)'
                      : undefined
                  }}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  onMouseEnter={() => handleCellHover(rowIndex, colIndex)}
                >
                  {renderCornerMarker(rowIndex, colIndex)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Board;
