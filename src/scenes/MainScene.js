class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.atlas('anna', 'assets/anna.png', 'assets/anna.json');
        this.load.atlas('lu', 'assets/lu.png', 'assets/lu.json');

        this.load.on('filecomplete-atlas-anna', () => {
            this.textures.get('anna').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });
        this.load.on('filecomplete-atlas-lu', () => {
            this.textures.get('lu').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });
    }

    create(data) {
        this.gameState = {
            level: 1,
            objective: 'Show the correct ID to the security guard',
            score: 0,
            anxiety: 0,
            choices: [],
            interactionCooldown: false
        };

        this.currentCharacter = data?.character || 'anna';
        this.playerDir = 'right';
        this.isNearGuard = false;
        this.isChoosing = false;

        this.buildBackground();
        this.buildPlatforms();
        this.buildPlayer();
        this.buildAnimations();
        this.buildGuard();
        this.buildUI();
        this.setupControls();
        this.setupColliders();

        this.player.anims.play('anna-idle');
    }

    // ─── Background ───────────────────────────────────────────────────────────

    buildBackground() {
        const g = this.add.graphics();

        g.fillStyle(0x1a1a2e, 1);
        g.fillRect(0, 0, 800, 80);

        g.fillStyle(0x16213e, 1);
        g.fillRect(0, 80, 800, 420);

        g.fillStyle(0x0f3460, 1);
        g.fillRect(0, 500, 800, 100);

        g.lineStyle(1, 0x1e2d5a, 1);
        for (let y = 100; y < 500; y += 40) {
            g.lineBetween(0, y, 800, y);
        }
        for (let x = 0; x < 800; x += 80) {
            g.lineBetween(x, 80, x, 500);
        }

        // Door frame
        g.fillStyle(0x0a0a0a, 1);
        g.fillRect(700, 370, 70, 130);
        g.lineStyle(3, 0x888800, 1);
        g.strokeRect(700, 370, 70, 130);

        this.add.text(715, 355, 'EXIT', {
            fontSize: '14px',
            fill: '#888800',
            fontFamily: 'monospace'
        });

        this.add.rectangle(640, 360, 160, 30, 0x1a1a1a);
        this.add.text(570, 348, '[ SECURITY CHECKPOINT ]', {
            fontSize: '11px',
            fill: '#ffcc00',
            fontFamily: 'monospace'
        });
    }

    // ─── Platforms ────────────────────────────────────────────────────────────

    buildPlatforms() {
        this.platforms = this.physics.add.staticGroup();

        const addPlat = (x, y, w, h, color) => {
            const p = this.add.rectangle(x, y, w, h, color);
            this.physics.add.existing(p, true);
            p.body.setSize(w, h);
            p.body.reset(x, y);
            this.platforms.add(p);
        };

        addPlat(400, 536, 800, 32, 0x1a4a6a);
        addPlat(600, 420, 200, 20, 0x2a6a4a);
        addPlat(200, 300, 200, 20, 0x2a6a4a);
        addPlat(750, 260, 160, 20, 0x2a6a4a);
        addPlat(330, 370, 80, 14, 0x006688);
        addPlat(430, 330, 60, 14, 0x006688);
        addPlat(520, 240, 70, 14, 0x006688);
    }

    // ─── Player ───────────────────────────────────────────────────────────────

    buildPlayer() {
        this.player = this.physics.add.sprite(100, 450, 'anna');
        this.player.setScale(2.5);
        //fix invisible hitbox around the player
        this.player.body.setSize(8, 24);
        this.player.body.setOffset(5, 6);
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);
    }

    // ─── Animations ───────────────────────────────────────────────────────────

    buildAnimations() {
        this.anims.create({
            key: 'anna-idle',
            frames: this.anims.generateFrameNames('anna', {
                prefix: 'Sprite-0002 ', suffix: '.aseprite', start: 5, end: 5
            }),
            frameRate: 1, repeat: 0
        });
        this.anims.create({
            key: 'anna-walk',
            frames: this.anims.generateFrameNames('anna', {
                prefix: 'Sprite-0002 ', suffix: '.aseprite', start: 0, end: 11
            }),
            frameRate: 10, repeat: -1
        });
        this.anims.create({
            key: 'anna-jump',
            frames: this.anims.generateFrameNames('anna', {
                prefix: 'Sprite-0002 ', suffix: '.aseprite', start: 6, end: 8
            }),
            frameRate: 8, repeat: 0
        });

        this.anims.create({
            key: 'lu-idle',
            frames: this.anims.generateFrameNames('lu', {
                prefix: 'Sprite-0001 ', suffix: '.', start: 5, end: 5
            }),
            frameRate: 1, repeat: 0
        });
        this.anims.create({
            key: 'lu-walk',
            frames: this.anims.generateFrameNames('lu', {
                prefix: 'Sprite-0001 ', suffix: '.', start: 0, end: 11
            }),
            frameRate: 10, repeat: -1
        });
        this.anims.create({
            key: 'lu-jump',
            frames: this.anims.generateFrameNames('lu', {
                prefix: 'Sprite-0001 ', suffix: '.', start: 6, end: 8
            }),
            frameRate: 8, repeat: 0
        });
    }

    // ─── Guard ────────────────────────────────────────────────────────────────

    buildGuard() {
        this.guard = this.add.rectangle(690, 506, 28, 46, 0x667788);
        this.add.circle(690, 473, 12, 0xddbb99);
        this.add.rectangle(690, 461, 28, 8, 0x334455);
        this.add.text(675, 518, 'GUARD', {
            fontSize: '11px', fill: '#aabbcc', fontFamily: 'monospace'
        });
    }

    // ─── UI ───────────────────────────────────────────────────────────────────

    buildUI() {
        this.objectiveText = this.add.text(20, 14, `▶ ${this.gameState.objective}`, {
            fontSize: '13px', fill: '#aaddff', fontFamily: 'monospace'
        });

        this.scoreText = this.add.text(20, 32, `SCORE: ${this.gameState.score}`, {
            fontSize: '13px', fill: '#ffffff', fontFamily: 'monospace'
        });

        this.add.text(20, 50, 'ANXIETY:', {
            fontSize: '12px', fill: '#ff6666', fontFamily: 'monospace'
        });
        this.add.rectangle(105, 57, 150, 12, 0x333333).setOrigin(0, 0.5);
        this.anxietyBar = this.add.rectangle(105, 57, 0, 12, 0xff3333).setOrigin(0, 0.5);
        this.anxietyLabel = this.add.text(262, 50, '0%', {
            fontSize: '12px', fill: '#ff6666', fontFamily: 'monospace'
        });

        this.feedbackText = this.add.text(20, 68, 'Press H for help', {
            fontSize: '13px', fill: '#ffff99', fontFamily: 'monospace'
        });

        // Character switcher
        this.add.rectangle(720, 30, 80, 28, 0x224488)
            .setInteractive()
            .on('pointerdown', () => this.switchCharacter('anna'));
        this.add.text(720, 30, 'Anna', {
            fontSize: '13px', fill: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.rectangle(720, 62, 80, 28, 0x882222)
            .setInteractive()
            .on('pointerdown', () => this.switchCharacter('lu'));
        this.add.text(720, 62, 'Lu', {
            fontSize: '13px', fill: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(20, 560, 'WASD / Arrows: Move   W / Up: Jump   E: Interact   H: Help', {
            fontSize: '11px', fill: '#445566', fontFamily: 'monospace'
        });

        this.interactText = this.add.text(400, 410, '', {
            fontSize: '15px', fill: '#ffff99', fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.choiceBox = this.add.rectangle(400, 300, 380, 170, 0x000000, 0.92).setVisible(false);
        this.choiceText = this.add.text(400, 300, '', {
            fontSize: '16px', fill: '#ffffff', fontFamily: 'monospace', align: 'center'
        }).setOrigin(0.5).setVisible(false);
    }

    // ─── Controls ─────────────────────────────────────────────────────────────

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.helpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
        this.oneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.twoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.threeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    }

    setupColliders() {
        this.physics.add.collider(this.player, this.platforms);
    }

    // ─── Character Switch ─────────────────────────────────────────────────────

    switchCharacter(name) {
        this.currentCharacter = name;
        this.player.setTexture(name);
        this.player.anims.play(`${name}-idle`);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    update() {
        this.handleMovement();
        this.handleGuardInteraction();
        this.handleChoices();
        this.updateUI();
    }

    handleMovement() {
        if (this.isChoosing) return;

        const char = this.currentCharacter;
        const onGround = this.player.body.touching.down;
        const isLeft = this.cursors.left.isDown || this.wasd.A.isDown;
        const isRight = this.cursors.right.isDown || this.wasd.D.isDown;

        if (isLeft) {
            this.player.body.setVelocityX(-180);
            this.player.setFlipX(true);
            if (onGround && this.player.anims.currentAnim?.key !== `${char}-walk`) {
                this.player.anims.play(`${char}-walk`);
            }
        } else if (isRight) {
            this.player.body.setVelocityX(180);
            this.player.setFlipX(false);
            if (onGround && this.player.anims.currentAnim?.key !== `${char}-walk`) {
                this.player.anims.play(`${char}-walk`);
            }
        } else {
            this.player.body.setVelocityX(0);
            if (onGround && this.player.anims.currentAnim?.key !== `${char}-idle`) {
                this.player.anims.play(`${char}-idle`);
            }
        }

        if ((this.cursors.up.isDown || this.wasd.W.isDown) && onGround) {
            this.player.body.setVelocityY(-370);
            this.player.anims.play(`${char}-jump`);
        }

        if (this.player.body.velocity.y < 0 && !(this.cursors.up.isDown || this.wasd.W.isDown)) {
            this.player.body.setVelocityY(this.player.body.velocity.y * 0.5);
        }

        if (!onGround && this.player.body.velocity.y > 0) {
            if (this.player.anims.currentAnim?.key !== `${char}-jump`) {
                this.player.anims.play(`${char}-jump`);
            }
        }
    }

    handleGuardInteraction() {
        if (this.isChoosing || this.gameState.interactionCooldown) return;

        const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.guard.x, this.guard.y
        );

        if (dist < 90) {
            this.isNearGuard = true;
            this.interactText.setText('[ Press E to interact ]');
        } else {
            this.isNearGuard = false;
            this.interactText.setText('');
        }

        if (this.isNearGuard && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            this.openChoiceMenu();
        }

        if (Phaser.Input.Keyboard.JustDown(this.helpKey)) {
            this.feedbackText.setText('HELP: Walk to the guard and press E. Show the right ID!');
        }
    }

    openChoiceMenu() {
        this.isChoosing = true;
        this.choiceBox.setVisible(true);
        this.choiceText.setVisible(true);
        this.interactText.setText('');
        this.choiceText.setText(
            'What do you show?\n\n' +
            '1 — Student ID\n' +
            '2 — Credit Card\n' +
            '3 — Library Card'
        );
        this.feedbackText.setText('Make your choice...');
    }

    closeChoiceMenu() {
        this.isChoosing = false;
        this.choiceBox.setVisible(false);
        this.choiceText.setVisible(false);

        this.gameState.interactionCooldown = true;
        this.time.delayedCall(2000, () => {
            this.gameState.interactionCooldown = false;
        });
    }

    handleChoices() {
        if (!this.isChoosing) return;

        if (Phaser.Input.Keyboard.JustDown(this.oneKey)) {
            this.gameState.score += 100;
            this.gameState.choices.push('Student ID ✓');
            this.feedbackText.setText('✓ Correct! The guard lets you through.');
            this.closeChoiceMenu();
            this.time.delayedCall(1500, () => {
                this.scene.start('WinScene', {
                    score: this.gameState.score,
                    choices: this.gameState.choices
                });
            });
        }

        if (Phaser.Input.Keyboard.JustDown(this.twoKey)) {
            this.gameState.anxiety = Math.min(100, this.gameState.anxiety + 25);
            this.gameState.choices.push('Credit Card ✗');
            this.feedbackText.setText('✗ A credit card is not valid ID here.');
            this.closeChoiceMenu();
            this.checkAnxiety();
        }

        if (Phaser.Input.Keyboard.JustDown(this.threeKey)) {
            this.gameState.anxiety = Math.min(100, this.gameState.anxiety + 10);
            this.gameState.choices.push('Library Card ✗');
            this.feedbackText.setText('✗ A library card won\'t work here.');
            this.closeChoiceMenu();
            this.checkAnxiety();
        }
    }

    checkAnxiety() {
        if (this.gameState.anxiety >= 100) {
            this.time.delayedCall(1000, () => {
                this.scene.start('GameOverScene', {
                    anxiety: this.gameState.anxiety,
                    choices: this.gameState.choices
                });
            });
        }
    }

    updateUI() {
        this.scoreText.setText(`SCORE: ${this.gameState.score}`);
        const barWidth = (this.gameState.anxiety / 100) * 150;
        this.anxietyBar.width = barWidth;
        this.anxietyBar.setFillStyle(this.gameState.anxiety < 50 ? 0xffaa00 : 0xff2222);
        this.anxietyLabel.setText(`${this.gameState.anxiety}%`);
    }
}