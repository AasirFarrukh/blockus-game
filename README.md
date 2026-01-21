# Blokus Game

A web-based implementation of the classic Blokus board game built with React.

## Features

- 4-player gameplay
- All 21 unique Blokus pieces
- Piece rotation and flipping
- Valid placement checking
- Score tracking
- Corner markers for starting positions
- Responsive design

## How to Play

1. Each player starts from their corner (marked with colored dots)
2. First piece must cover your starting corner
3. Subsequent pieces must touch the corners of your existing pieces (not edges!)
4. Players take turns placing pieces
5. Game ends when no more valid moves can be made
6. Player with the highest score (most squares placed) wins!

## Installation
```bash
npm install
```

## Run the Game
```bash
npm start
```

The game will open in your browser at `http://localhost:3000`

## Controls

- **Click a piece** to select it
- **Rotate** button to rotate the piece 90°
- **Flip** button to flip the piece horizontally
- **Click on the board** to place the selected piece
- **Pass Turn** to skip your turn
- **New Game** to restart
- **End Game** to see final scores

## Technologies Used

- React 18
- CSS3
- JavaScript ES6+

## Game Rules

- 20x20 game board
- 4 players (Blue, Red, Green, Yellow)
- 21 unique pieces per player
- Each piece consists of 1-5 squares
- Strategic placement is key to winning!

Enjoy playing Blokus!