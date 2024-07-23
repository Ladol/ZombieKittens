const { createDeck, shuffleDeck } = require('./deck');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let players = [null, null, null, null, null]; // Array to track players
let gameStarted = false;

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
    let playerCards = players.map((player, index) => {
        if (player) {
            let hand = [{ type: 'zombie' }]; // Each player gets one zombie
            for (let i = 0; i < 7; i++) {
                hand.push(deck.pop());
            }
            return { playerIndex: index, hand };
        }
        return null;
    });

    // Prepare the middle pile
    let middlePile = [];
    for (let i = 0; i < activePlayers - 1; i++) {
        middlePile.push({ type: 'explode' });
    }
    middlePile = middlePile.concat(deck);

    // Update card count
    io.emit('update_card_count', middlePile.length);

    // Send player hands to respective players
    playerCards.forEach(playerCard => {
        if (playerCard) {
            io.to(players[playerCard.playerIndex].id).emit('receive_hand', playerCard);
        }
    });

    // Log the middle pile
    console.log("Middle pile: ", middlePile);

    // Notify all players that the game has started
    io.emit('game_started');
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
            players[playerIndex] = { id: socket.id, name };
            io.emit('update_players', players);
            io.emit('update_start_button', players.filter(player => player !== null).length >= 2);
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected');
            players[playerIndex] = null;
            io.emit('update_players', players);
            io.emit('update_start_button', players.filter(player => player !== null).length >= 2);
        });
    } else {
        socket.emit('no_slots_available');
    }

    socket.on('start_game', () => {
        startGame();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});