class WinScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WinScene' });
    }

    create(data) {
        const isLastLevel = data.level >= 2;

        this.add.rectangle(400, 300, 800, 600, 0x0a1a0a);

        this.add.text(400, 120, '✓ CHECKPOINT CLEARED', {
            fontSize: '32px',
            fill: '#44ff88',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(400, 185, `Score so far: ${data.score}`, {
            fontSize: '22px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(400, 230, 'Your choices:', {
            fontSize: '16px',
            fill: '#aaaaaa',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        const choiceList = (data.choices || []).join('\n') || 'No choices recorded';
        this.add.text(400, 290, choiceList, {
            fontSize: '15px',
            fill: '#dddddd',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5);

        if (isLastLevel) {
            // Final win screen
            this.add.text(400, 400, '🎉 You completed Beyond Barriers!', {
                fontSize: '20px',
                fill: '#ffcc00',
                fontFamily: 'monospace',
                align: 'center'
            }).setOrigin(0.5);

            this.add.text(400, 460, 'Press SPACE to play again', {
                fontSize: '16px',
                fill: '#ffff99',
                fontFamily: 'monospace'
            }).setOrigin(0.5);

            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.start('TitleScene');
            });
        } else {
            // Between levels
            this.add.text(400, 400, 'Next: The Classroom', {
                fontSize: '18px',
                fill: '#aaddff',
                fontFamily: 'monospace'
            }).setOrigin(0.5);

            this.add.text(400, 460, 'Press SPACE to continue', {
                fontSize: '16px',
                fill: '#ffff99',
                fontFamily: 'monospace'
            }).setOrigin(0.5);

            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.start('CampusScene', {
                    score: data.score,
                    choices: data.choices,
                    character: data.character
                });
            });
        }
    }
}