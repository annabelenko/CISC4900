class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    preload() {
        this.load.spritesheet('background', 'assets/background.png', { frameWidth: 80, frameHeight: 60 });
        this.load.atlas('anna', 'assets/anna.png', 'assets/anna.json');
        this.load.atlas('lu', 'assets/lu.png', 'assets/lu.json');

        this.load.on('filecomplete-atlas-anna', () => {
            this.textures.get('anna').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });
        this.load.on('filecomplete-atlas-lu', () => {
            this.textures.get('lu').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });
        this.load.on('filecomplete-spritesheet-background', () => {
            this.textures.get('background').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });

        this.load.audio('titleMusic', 'assets/sounds/titleMusic.mp3');
    }

    create() {
        this.selectedCharacter = 'anna';

        this.buildBackground();
        this.buildTitle();
        this.buildCharacterSelect();
        this.buildStartPrompt();
        this.buildCredits();
        this.setupControls();

        this.titleMusic = this.sound.add('titleMusic', { loop: true, volume: 0.4 });
        this.titleMusic.play();

        this.events.once('shutdown', () => {
            this.titleMusic.stop();
        });
    }

    // ─── Rounded-bg text helper ──────────────────────────────────────────────

    _mkText(x, y, content, style, { radius = 6, padX = 8, padY = 4 } = {}) {
        const txt = this.add.text(x, y, content, style).setOrigin(0.5);
        const w = txt.displayWidth + padX * 2;
        const h = txt.displayHeight + padY * 2;
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.85);
        bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, radius);
        this.children.moveBelow(bg, txt);
        return txt;
    }

    // ─── Background ───────────────────────────────────────────────────────────

    buildBackground() {
        if (!this.anims.exists('bg-anim')) {
            this.anims.create({
                key: 'bg-anim',
                frames: this.anims.generateFrameNumbers('background', { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1
            });
        }
        this.add.sprite(400, 300, 'background').setScale(10).play('bg-anim');
    }

    // ─── Title ────────────────────────────────────────────────────────────────

    buildTitle() {
        // Subtitle above
        this._mkText(400, 60, '✦  A  G A M E  A B O U T  E M P A T H Y  ✦', {
            fontSize: '11px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            letterSpacing: 4
        });

        // Main title - BEYOND
        this._mkText(400, 130, 'BEYOND', {
            fontSize: '72px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }, { padX: 12, padY: 6 });

        // Main title - BARRIERS (with accent color)
        const barriers = this._mkText(400, 205, 'BARRIERS', {
            fontSize: '72px',
            fill: '#44aaff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }, { padX: 12, padY: 6 });

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
        this._mkText(400, 268, 'Step into their shoes.  See through their lens.', {
            fontSize: '13px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        });
    }

    // ─── Character Select ─────────────────────────────────────────────────────

    buildCharacterSelect() {
        this._mkText(400, 310, '— CHOOSE YOUR CHARACTER —', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        });

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
        this.annaGlow = this.annaSprite.postFX.addGlow(0xffdd00, 6, 0, false, 0.1, 16);

        this.annaLabel = this._mkText(270, 450, 'ANNA', {
            fontSize: '14px',
            fill: '#aaddff',
            fontFamily: 'monospace',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
        });

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
        this.luGlow = this.luSprite.postFX.addGlow(0xffdd00, 0, 0, false, 0.1, 16);

        this.luLabel = this._mkText(530, 450, 'LU', {
            fontSize: '14px',
            fill: '#445566',
            fontFamily: 'monospace',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
        });

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
            this.annaGlow.outerStrength = 6;
            this.luGlow.outerStrength = 0;
        } else {
            this.luSprite.setAlpha(1);
            this.annaSprite.setAlpha(0.4);
            this.luLabel.setFill('#aaddff');
            this.annaLabel.setFill('#445566');
            this.selector.setX(530);
            this.luGlow.outerStrength = 6;
            this.annaGlow.outerStrength = 0;
        }
    }

    // ─── Start Prompt ─────────────────────────────────────────────────────────

    buildStartPrompt() {
        this.startText = this._mkText(400, 500, 'PRESS  SPACE  TO  START', {
            fontSize: '16px',
            fill: '#ffff99',
            fontFamily: 'monospace'
        });

        // Blinking effect
        this.tweens.add({
            targets: this.startText,
            alpha: 0,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Linear'
        });

        this._mkText(400, 530, '← → or click to switch character', {
            fontSize: '11px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        });
    }

    // ─── Credits ──────────────────────────────────────────────────────────────

    buildCredits() {
        this._mkText(400, 570, 'By Luis Gonzalez & Anna Belenko  ·  The Three Lives  ·  Prof. Goetz', {
            fontSize: '10px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        });
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