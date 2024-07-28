const { createDeck, shuffleDeck } = require('./deck');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*', // You can specify your allowed origin here
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let players = [null, null, null, null, null]; // Array to track players
let gameStarted = false;
let currentPlayerIndex = null; // Track the current player index
let middlePile = [];
let playerHand = {}; // Track player hands
let cardsToDraw = 1;

function getNextAlivePlayerIndex(startIndex) {
    // Find the next alive player starting from startIndex
    let index = (startIndex + 1) % players.length;
    while (index !== startIndex) {
        if (players[index] && players[index].alive) {
            return index;
        }
        index = (index + 1) % players.length;
    }
    return null; // No alive players found
}

// Function to start the game
function startGame() {
    if (gameStarted) return; // Prevent starting the game again if already started
    gameStarted = true;

    let activePlayers = players.filter(player => player !== null).length;

    if (activePlayers < 2) {
        console.log("Not enough players to start the game.");
        return;
    }

    let deck = createDeck();

    if (activePlayers === 2) {
        deck = deck.filter(card => card.paw); // Use only cards with paw for 2 players
    } else if (activePlayers === 3) {
        deck = deck.filter(card => !card.paw); // Use only cards without paw for 3 players
    }

    deck = shuffleDeck(deck);

    // Distribute cards to players
    players.forEach((player, index) => {
        if (player) {
            player.alive = true;
            playerHand[index] = [{ type: 'zombie' }]; // Each player gets one zombie
            for (let i = 0; i < 7; i++) {
                playerHand[index].push(deck.pop());
            }
        }
    });

    // Prepare the middle pile
    middlePile = [];
    for (let i = 0; i < activePlayers - 1; i++) {
        middlePile.push({ type: 'explode' });
    }
    middlePile = middlePile.concat(deck);
    middlePile = shuffleDeck(middlePile);

    // Update card count
    io.emit('update_card_count', middlePile.length);

    // Send player hands to respective players
    for (const [playerIndex, hand] of Object.entries(playerHand)) {
        io.to(players[playerIndex].id).emit('receive_hand', { playerIndex: parseInt(playerIndex), hand });
    }

    // Log the middle pile
    console.log("Middle pile: ", middlePile);

    // Randomly select the first player to play
    const alivePlayers = players.filter(player => player !== null && player.alive);
    if (alivePlayers.length > 0) {
        currentPlayerIndex = Math.floor(Math.random() * alivePlayers.length);
        io.emit('game_started', currentPlayerIndex); // Notify all players and send the starting player index
    }
}


function endTurnServer() {
    if (currentPlayerIndex !== null) {
        let nextPlayerIndex = getNextAlivePlayerIndex(currentPlayerIndex);
        if (nextPlayerIndex !== null) {
            currentPlayerIndex = nextPlayerIndex;
            io.emit('turn_changed', currentPlayerIndex); // Notify all players of the turn change
        } else {
            // No alive players left
            io.emit('game_ended'); // Notify all players that the game has ended
        }
    }
    cardsToDraw = 1;
}

io.on('connection', (socket) => {
    if (gameStarted) {
        socket.emit('game_in_progress');
        socket.disconnect();
        return;
    }

    console.log('A user connected');

    let playerIndex = players.findIndex(player => player === null);
    if (playerIndex !== -1) {
        socket.emit('assign_slot', playerIndex);

        socket.on('player_name', (name) => {
            players[playerIndex] = { id: socket.id, name, alive: true };
            io.emit('update_players', players);
            io.emit('update_start_button', players.filter(player => player !== null).length >= 2);
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected');
            if (players[playerIndex]) {
                players[playerIndex].alive = false; // Mark player as dead
                io.emit('update_players', players);
                io.emit('update_start_button', players.filter(player => player !== null && player.alive).length >= 2);
            }
        });
    } else {
        socket.emit('no_slots_available');
    }

    socket.on('start_game', () => {
        startGame();
    });

    socket.on('end_turn', () => {
        endTurnServer();
    });

    socket.on('draw_card', () => {
        if (currentPlayerIndex !== null && players[currentPlayerIndex].id === socket.id) {
            // Check if there's a card left in the middle pile
            if (middlePile.length > 0) {
                let drawnCard = middlePile.pop();
                // Add the drawn card to the player's hand
                playerHand[currentPlayerIndex].push(drawnCard);
                
                // Notify the current player of the drawn card
                io.to(players[currentPlayerIndex].id).emit('receive_hand', { playerIndex: currentPlayerIndex, hand: playerHand[currentPlayerIndex] });
                
                // Notify all players of the updated card count
                io.emit('update_card_count', middlePile.length);

                --cardsToDraw;
                if (cardsToDraw <= 0) {
                    endTurnServer();
                }
            } else {
                // Notify the current player if no cards are left to draw
                io.to(socket.id).emit('no_cards_left');
            }
        } else {
            // Notify the player if it's not their turn
            io.to(socket.id).emit('not_your_turn');
        }
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
