const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 320 },
            debug: false
        }
    },
    scene: [MainScene, WinScene, GameOverScene]
};

const game = new Phaser.Game(gameConfig);

window.addEventListener('error', (e) => {
    console.error('Game Error:', e.message, e.filename, e.lineno);
});