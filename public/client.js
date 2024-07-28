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
