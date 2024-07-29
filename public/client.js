const socket = io();

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('assign_slot', (slot) => {
    let playerName = prompt('Enter your name:');
    if (playerName) {
        socket.emit('player_name', playerName);
    } else {
        alert('Name is required to join the game.');
        socket.disconnect();
    }
});

socket.on('update_players', (players) => {
    for (let i = 0; i < players.length; i++) {
        let playerDiv = document.querySelector(`.player${i + 1}`);
        playerDiv.textContent = players[i] ? players[i].name : '';
        if (players[i]) {
            playerDiv.innerHTML = `
                ${players[i].name}
                <select class="card-dropdown" id="player${i + 1}-cards" style="display: none;"></select>
            `;
        } else {
            playerDiv.innerHTML = '';
        }
    }
});

socket.on('update_start_button', (canStart) => {
    document.getElementById('start-button').disabled = !canStart;
});

document.getElementById('start-button').addEventListener('click', () => {
    socket.emit('start_game');
    document.getElementById('start-button').disabled = true; // Disable the button once clicked
});

document.getElementById('draw-button').addEventListener('click', () => {
    socket.emit('draw_card');
});

document.getElementById('play-card-button').addEventListener('click', () => {
    let cardDropdown = document.querySelector(`#player${currentPlayerIndex + 1}-cards`);
    if (cardDropdown) {
        let selectedCard = cardDropdown.value;
        if (selectedCard) {
            socket.emit('play_card', selectedCard);
        } else {
            alert('Please select a card to play.');
        }
    }
});

socket.on('receive_hand', ({ playerIndex, hand }) => {
    console.log('Your hand:', hand);
    let cardDropdown = document.querySelector(`#player${playerIndex + 1}-cards`);
    if (cardDropdown) { // Check if cardDropdown exists
        cardDropdown.style.display = 'block';
        cardDropdown.innerHTML = hand.map(card => `<option value="${card.type}">${card.type}</option>`).join('');
    } else {
        console.error('Card dropdown not found for player:', playerIndex);
    }
});

socket.on('game_in_progress', () => {
    alert('The game is already in progress. You cannot join at this time.');
    socket.disconnect();
});

socket.on('no_slots_available', () => {
    alert('No slots available, please try again later.');
    socket.disconnect();
});

socket.on('update_card_count', (count) => {
    document.querySelector('.card-count').textContent = `Cards: ${count}`;
});

socket.on('game_started', (startingPlayerIndex) => {
    console.log(`Game started! Player ${startingPlayerIndex + 1} goes first.`);
    currentPlayerIndex = startingPlayerIndex;
    checkTurn();
});

socket.on('turn_changed', (currentPlayerIndex) => {
    console.log(`It's now player ${currentPlayerIndex + 1}'s turn.`);
    currentPlayerIndex = currentPlayerIndex;
    checkTurn();
});

// Call this method when a player ends their turn
function endTurn() {
    socket.emit('end_turn');
}

socket.on('not_your_turn', () => {
    alert('It is not your turn to draw a card.');
});

socket.on('no_cards_left', () => {
    alert('No cards left in the middle pile.');
});

socket.on('game_ended', () => {
    alert('The game has ended.');
});

socket.on('update_played_pile', (card) => {
    document.querySelector('.playedpile').textContent = `Last card played: ${card}`;
});

function checkTurn() {
    let isCurrentPlayer = currentPlayerIndex === parseInt(socket.id);
    document.getElementById('draw-button').disabled = !isCurrentPlayer;
    document.getElementById('play-card-button').disabled = !isCurrentPlayer;
}
