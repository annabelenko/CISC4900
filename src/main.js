// Game configuration
const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game',
    backgroundColor: '#2c3e50',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [MainScene]
};

// Add some debugging
console.log('Starting Phaser game...');
console.log('MainScene available:', typeof MainScene !== 'undefined');

// Initialize the game
const game = new Phaser.Game(gameConfig);

// Add event listeners to check if game starts
game.events.on('ready', () => {
    console.log('Game is ready!');
});

// Add error handling
window.addEventListener('error', (e) => {
    console.error('JavaScript Error:', e.message, e.filename, e.lineno);
});