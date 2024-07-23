// Function to create the deck of cards
function createDeck() {
    return [
        { type: 'explode' }, { type: 'explode' }, { type: 'explode' }, { type: 'explode' },
        { type: 'zombie' }, { type: 'zombie' }, { type: 'zombie', paw: true }, { type: 'zombie', paw: true }, { type: 'zombie' },
        { type: 'attackX2' }, { type: 'attackX2' }, { type: 'attackX2', paw: true }, { type: 'attackX2', paw: true },
        { type: 'attackD' }, { type: 'attackD' }, { type: 'attackD' },
        { type: 'nope' }, { type: 'nope' }, { type: 'nope', paw: true }, { type: 'nope', paw: true }, { type: 'nope', now: true }, { type: 'nope', now: true }, { type: 'nope', now: true }, { type: 'nope', now: true }, { type: 'nope', now: true },
        { type: 'skip' }, { type: 'skip' }, { type: 'skip', paw: true },
        { type: 'super skip' }, { type: 'super skip', paw: true },
        { type: 'future' }, { type: 'future' }, { type: 'future', paw: true }, { type: 'future', paw: true },
        { type: 'shuffle' }, { type: 'shuffle' }, { type: 'shuffle', paw: true }, { type: 'shuffle', now: true }, { type: 'shuffle', now: true },
        { type: 'feed' }, { type: 'feed' }, { type: 'feed', now: true }, { type: 'feed', now: true },
        { type: 'clone' }, { type: 'clone' }, { type: 'clone', paw: true },
        { type: 'grave' },
        { type: 'favour' }, { type: 'favour' }, { type: 'favour', paw: true },
        { type: 'dig' }, { type: 'dig' }, { type: 'dig', paw: true }, { type: 'dig', paw: true },
        { type: 'clairvoyance' }, { type: 'clairvoyance' }, { type: 'clairvoyance', paw: true }, { type: 'clairvoyance', now: true }, { type: 'clairvoyance', now: true },
        { type: 'C1' }, { type: 'C1' }, { type: 'C1', paw: true }, { type: 'C1', paw: true },
        { type: 'C2' }, { type: 'C2' }, { type: 'C2', paw: true }, { type: 'C2', paw: true },
        { type: 'C3' }, { type: 'C3' }, { type: 'C3', paw: true }, { type: 'C3', paw: true },
        { type: 'C4' }, { type: 'C4' }, { type: 'C4', paw: true }, { type: 'C4', paw: true },
    ];
}

// Function to shuffle the deck of cards
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

module.exports = {
    createDeck,
    shuffleDeck
};
