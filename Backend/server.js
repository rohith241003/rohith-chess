ws.on('message', (message) => {
  const parsedMessage = JSON.parse(message);

  if (parsedMessage.type === 'MOVE') {
    const { row, col, character, move } = parsedMessage.data;

    // Ensure that only the current player's character can be moved
    if (!character.startsWith(gameState.currentPlayer)) {
      console.log(`It's not ${character}'s turn!`);
      return; // Ignore the move if it's not the current player's turn
    }

    // Find the character's current position on the board
    let currentRow, currentCol;
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (gameState.board[i][j] === character) {
          currentRow = i;
          currentCol = j;
          break;
        }
      }
    }

    if (currentRow !== undefined && currentCol !== undefined) {
      const targetCell = gameState.board[row][col];
      const opponent = gameState.currentPlayer === 'A' ? 'B' : 'A';

      // Check if the move resulted in hitting an opponent's character
      if (targetCell && targetCell.startsWith(opponent)) {
        gameState.board[row][col] = null;  // Remove the opponent's piece
      }

      // Move the character to the new position
      gameState.board[currentRow][currentCol] = null;  // Clear the old position
      gameState.board[row][col] = character;           // Place at the new position

      // Check if all opponent's characters are eliminated
      const opponentRemaining = gameState.board.flat().some(cell => cell && cell.startsWith(opponent));
      if (!opponentRemaining) {
        gameState.winner = gameState.currentPlayer;
      }

      // Toggle current player if no winner yet
      if (!gameState.winner) {
        gameState.currentPlayer = gameState.currentPlayer === 'A' ? 'B' : 'A';
      }

      // Broadcast updated game state to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(gameState));
        }
      });
    }
  }

  // Handle game restart
  if (parsedMessage.type === 'RESTART') {
    resetGame();
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(gameState));
      }
    });
  }
});
