class WinScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WinScene' });
    }

    create(data) {
        this.add.rectangle(400, 300, 800, 600, 0x0a1a0a);

        this.add.text(400, 150, '✓ ACCESS GRANTED', {
            fontSize: '36px',
            fill: '#44ff88',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(400, 220, `Final Score: ${data.score}`, {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(400, 270, 'Your choices:', {
            fontSize: '18px',
            fill: '#aaaaaa',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        const choiceList = (data.choices || []).join('\n') || 'No choices recorded';
        this.add.text(400, 320, choiceList, {
            fontSize: '16px',
            fill: '#dddddd',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(400, 450, 'Press SPACE to play again', {
            fontSize: '18px',
            fill: '#ffff99',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('MainScene');
        });
    }
}