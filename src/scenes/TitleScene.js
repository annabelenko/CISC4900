class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.atlas('anna', 'assets/anna.png', 'assets/anna.json');
        this.load.atlas('lu', 'assets/lu.png', 'assets/lu.json');

        this.load.on('filecomplete-atlas-anna', () => {
            this.textures.get('anna').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });
        this.load.on('filecomplete-atlas-lu', () => {
            this.textures.get('lu').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });
    }

    create() {
        this.selectedCharacter = 'anna';

        this.buildBackground();
        this.buildTitle();
        this.buildCharacterSelect();
        this.buildStartPrompt();
        this.buildCredits();
        this.setupControls();
    }

    // ─── Background ───────────────────────────────────────────────────────────

    buildBackground() {
        this.add.image(400, 300, 'background');
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.5);
        overlay.fillRect(0, 0, 800, 600);
    }

    // ─── Title ────────────────────────────────────────────────────────────────

    buildTitle() {
        // Subtitle above
        this.add.text(400, 60, '✦  A  G A M E  A B O U T  E M P A T H Y  ✦', {
            fontSize: '11px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            letterSpacing: 4
        }).setOrigin(0.5);

        // Main title - BEYOND
        const beyond = this.add.text(400, 130, 'BEYOND', {
            fontSize: '72px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Main title - BARRIERS (with accent color)
        const barriers = this.add.text(400, 205, 'BARRIERS', {
            fontSize: '72px',
            fill: '#44aaff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Subtle glow effect via tweens
        this.tweens.add({
            targets: barriers,
            alpha: 0.75,
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Tagline
        this.add.text(400, 268, 'Step into their shoes.  See through their lens.', {
            fontSize: '13px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }

    // ─── Character Select ─────────────────────────────────────────────────────

    buildCharacterSelect() {
        this.add.text(400, 310, '— CHOOSE YOUR CHARACTER —', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Anna sprite
        this.annaSprite = this.add.sprite(270, 410, 'anna');
        this.annaSprite.setScale(4);

        if (!this.anims.exists('title-anna-idle')) {
            this.anims.create({
                key: 'title-anna-idle',
                frames: this.anims.generateFrameNames('anna', {
                    prefix: 'Sprite-0002 ', suffix: '.aseprite', start: 5, end: 5
                }),
                frameRate: 1, repeat: 0
            });
            this.anims.create({
                key: 'title-anna-walk',
                frames: this.anims.generateFrameNames('anna', {
                    prefix: 'Sprite-0002 ', suffix: '.aseprite', start: 0, end: 11
                }),
                frameRate: 8, repeat: -1
            });
        }
        this.annaSprite.anims.play('title-anna-walk');

        this.annaLabel = this.add.text(270, 450, 'ANNA', {
            fontSize: '14px',
            fill: '#aaddff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Lu sprite
        this.luSprite = this.add.sprite(530, 410, 'lu');
        this.luSprite.setScale(4);
        this.luSprite.setAlpha(0.4);

        if (!this.anims.exists('title-lu-idle')) {
            this.anims.create({
                key: 'title-lu-idle',
                frames: this.anims.generateFrameNames('lu', {
                    prefix: 'Sprite-0001 ', suffix: '.', start: 5, end: 5
                }),
                frameRate: 1, repeat: 0
            });
            this.anims.create({
                key: 'title-lu-walk',
                frames: this.anims.generateFrameNames('lu', {
                    prefix: 'Sprite-0001 ', suffix: '.', start: 0, end: 11
                }),
                frameRate: 8, repeat: -1
            });
        }
        this.luSprite.anims.play('title-lu-walk');
        this.luSprite.setFlipX(true);

        this.luLabel = this.add.text(530, 450, 'LU', {
            fontSize: '14px',
            fill: '#445566',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Selection indicator (arrow under selected character)
        this.selector = this.add.text(270, 468, '▲', {
            fontSize: '12px',
            fill: '#44aaff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Click to select
        this.annaSprite.setInteractive().on('pointerdown', () => this.selectCharacter('anna'));
        this.luSprite.setInteractive().on('pointerdown', () => this.selectCharacter('lu'));

        // Keyboard left/right to switch
        this.input.keyboard.on('keydown-LEFT', () => this.selectCharacter('anna'));
        this.input.keyboard.on('keydown-RIGHT', () => this.selectCharacter('lu'));
        this.input.keyboard.on('keydown-A', () => this.selectCharacter('anna'));
        this.input.keyboard.on('keydown-D', () => this.selectCharacter('lu'));
    }

    selectCharacter(name) {
        this.selectedCharacter = name;

        if (name === 'anna') {
            this.annaSprite.setAlpha(1);
            this.luSprite.setAlpha(0.4);
            this.annaLabel.setFill('#aaddff');
            this.luLabel.setFill('#445566');
            this.selector.setX(270);
        } else {
            this.luSprite.setAlpha(1);
            this.annaSprite.setAlpha(0.4);
            this.luLabel.setFill('#aaddff');
            this.annaLabel.setFill('#445566');
            this.selector.setX(530);
        }
    }

    // ─── Start Prompt ─────────────────────────────────────────────────────────

    buildStartPrompt() {
        this.startText = this.add.text(400, 500, 'PRESS  SPACE  TO  START', {
            fontSize: '16px',
            fill: '#ffff99',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Blinking effect
        this.tweens.add({
            targets: this.startText,
            alpha: 0,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Linear'
        });

        this.add.text(400, 530, '← → or click to switch character', {
            fontSize: '11px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }

    // ─── Credits ──────────────────────────────────────────────────────────────

    buildCredits() {
        this.add.text(400, 570, 'By Luis Gonzalez & Anna Belenko  ·  The Three Lives  ·  Prof. Goetz', {
            fontSize: '10px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }

    // ─── Controls ─────────────────────────────────────────────────────────────

    setupControls() {
        this.input.keyboard.on('keydown-SPACE', () => {
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('StoryScene', { character: this.selectedCharacter });
            });
        });
    }
}