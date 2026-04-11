class ClassroomScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ClassroomScene' });
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
            level: 2,
            objective: 'Find your seat and talk to the professor',
            score: data?.score || 0,
            anxiety: 0,
            choices: [],
            interactionCooldown: false
        };

        this.currentCharacter = data?.character || 'anna';
        this.isNearProfessor = false;
        this.isChoosing = false;
        this.playerDir = 'right';

        this.buildBackground();
        this.buildPlatforms();
        this.buildPlayer();
        this.buildAnimations();
        this.buildProfessor();
        this.buildUI();
        this.setupControls();
        this.setupColliders();

        this.player.anims.play(`${this.currentCharacter}-idle`);
    }

    // ─── Background ───────────────────────────────────────────────────────────

    buildBackground() {
        const g = this.add.graphics();

        // Ceiling
        g.fillStyle(0x2a1a0e, 1);
        g.fillRect(0, 0, 800, 80);

        // Walls - warm classroom color
        g.fillStyle(0x3d2b1f, 1);
        g.fillRect(0, 80, 800, 420);

        // Floor
        g.fillStyle(0x2a1a0a, 1);
        g.fillRect(0, 500, 800, 100);

        // Wall detail lines
        g.lineStyle(1, 0x4a3828, 1);
        for (let y = 100; y < 500; y += 40) {
            g.lineBetween(0, y, 800, y);
        }
        for (let x = 0; x < 800; x += 80) {
            g.lineBetween(x, 80, x, 500);
        }

        // Chalkboard on the right wall
        g.fillStyle(0x1a3322, 1);
        g.fillRect(540, 100, 240, 150);
        g.lineStyle(3, 0x8B7355, 1);
        g.strokeRect(540, 100, 240, 150);

        // Chalkboard text
        this.add.text(660, 130, 'DISABILITY\nSTUDIES 101', {
            fontSize: '16px',
            fill: '#aaffaa',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(660, 195, '[ Accommodations\n  Matter ]', {
            fontSize: '12px',
            fill: '#88cc88',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5);

        // Professor's desk
        const g2 = this.add.graphics();
        g2.fillStyle(0x5c3d1a, 1);
        g2.fillRect(560, 430, 180, 20);
        g2.fillStyle(0x4a2e0f, 1);
        g2.fillRect(570, 450, 20, 50);
        g2.fillRect(720, 450, 20, 50);

        this.add.text(645, 415, "PROFESSOR'S DESK", {
            fontSize: '10px',
            fill: '#aa8855',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Window on the left
        g2.fillStyle(0x87ceeb, 0.3);
        g2.fillRect(40, 110, 120, 90);
        g2.lineStyle(2, 0x8B7355, 1);
        g2.strokeRect(40, 110, 120, 90);
        g2.lineBetween(100, 110, 100, 200);
        g2.lineBetween(40, 155, 160, 155);

        this.add.text(100, 215, 'WINDOW', {
            fontSize: '10px',
            fill: '#aa8855',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }

    // ─── Platforms ────────────────────────────────────────────────────────────

    buildPlatforms() {
        this.platforms = this.physics.add.staticGroup();

        const addPlat = (x, y, w, h, color) => {
            const p = this.add.rectangle(x, y, w, h, color);
            this.physics.add.existing(p, true);
            this.platforms.add(p);
        };

        // Ground / floor
        addPlat(400, 536, 800, 32, 0x2a1a0a);

        // Classroom desks as platforms (student seats)
        addPlat(150, 430, 100, 16, 0x5c3d1a); // desk 1
        addPlat(300, 430, 100, 16, 0x5c3d1a); // desk 2
        addPlat(150, 330, 100, 16, 0x5c3d1a); // desk 3 (back row)
        addPlat(300, 330, 100, 16, 0x5c3d1a); // desk 4 (back row)

        // Raised area at the front (professor's area)
        addPlat(660, 490, 240, 16, 0x4a3010);

        // Steps up to raised area
        addPlat(530, 506, 60, 16, 0x3a2510);
    }

    // ─── Player ───────────────────────────────────────────────────────────────

    buildPlayer() {
        this.player = this.physics.add.sprite(80, 480, this.currentCharacter);
        this.player.setScale(2.5);
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(8, 24);
        this.player.body.setOffset(11, 6);
    }

    // ─── Animations ───────────────────────────────────────────────────────────

    buildAnimations() {
        // Only create if not already created
        if (!this.anims.exists('anna-idle')) {
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
        }

        if (!this.anims.exists('lu-idle')) {
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
    }

    // ─── Professor ────────────────────────────────────────────────────────────

    buildProfessor() {
        // Body
        this.professor = this.add.rectangle(660, 454, 28, 46, 0x8855aa);
        // Head
        this.add.circle(660, 422, 12, 0xddbb99);
        // Hair
        this.add.rectangle(660, 412, 26, 8, 0x553300);
        // Label
        this.add.text(630, 468, 'PROFESSOR', {
            fontSize: '10px',
            fill: '#cc99ff',
            fontFamily: 'monospace'
        });
    }

    // ─── UI ───────────────────────────────────────────────────────────────────

    buildUI() {
        // Level indicator
        this.add.text(400, 14, '— LEVEL 2: THE CLASSROOM —', {
            fontSize: '13px',
            fill: '#cc9944',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Objective
        this.objectiveText = this.add.text(20, 32, `▶ ${this.gameState.objective}`, {
            fontSize: '13px',
            fill: '#aaddff',
            fontFamily: 'monospace'
        });

        // Score
        this.scoreText = this.add.text(20, 50, `SCORE: ${this.gameState.score}`, {
            fontSize: '13px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        });

        // Anxiety bar
        this.add.text(20, 68, 'ANXIETY:', {
            fontSize: '12px',
            fill: '#ff6666',
            fontFamily: 'monospace'
        });
        this.add.rectangle(105, 75, 150, 12, 0x333333).setOrigin(0, 0.5);
        this.anxietyBar = this.add.rectangle(105, 75, 0, 12, 0xff3333).setOrigin(0, 0.5);
        this.anxietyLabel = this.add.text(262, 68, '0%', {
            fontSize: '12px',
            fill: '#ff6666',
            fontFamily: 'monospace'
        });

        // Feedback
        this.feedbackText = this.add.text(20, 85, 'Press H for help', {
            fontSize: '13px',
            fill: '#ffff99',
            fontFamily: 'monospace'
        });

        // Controls hint
        this.add.text(20, 560, 'WASD / Arrows: Move   W / Up: Jump   E: Interact   H: Help', {
            fontSize: '11px',
            fill: '#445566',
            fontFamily: 'monospace'
        });

        // Interact prompt
        this.interactText = this.add.text(400, 400, '', {
            fontSize: '15px',
            fill: '#ffff99',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Choice box (hidden by default)
        this.choiceBox = this.add.rectangle(400, 280, 420, 190, 0x000000, 0.92).setVisible(false);
        this.choiceText = this.add.text(400, 280, '', {
            fontSize: '15px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            align: 'center'
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

    // ─── Update ───────────────────────────────────────────────────────────────

    update() {
        this.handleMovement();
        this.handleProfessorInteraction();
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

    handleProfessorInteraction() {
        if (this.isChoosing || this.gameState.interactionCooldown) return;

        const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.professor.x, this.professor.y
        );

        if (dist < 100) {
            this.isNearProfessor = true;
            this.interactText.setText('[ Press E to talk to professor ]');
        } else {
            this.isNearProfessor = false;
            this.interactText.setText('');
        }

        if (this.isNearProfessor && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            this.openChoiceMenu();
        }

        if (Phaser.Input.Keyboard.JustDown(this.helpKey)) {
            this.feedbackText.setText('HELP: Walk to the professor and press E. Show your accommodation letter!');
        }
    }

    openChoiceMenu() {
        this.isChoosing = true;
        this.choiceBox.setVisible(true);
        this.choiceText.setVisible(true);
        this.interactText.setText('');
        this.choiceText.setText(
            'The professor asks why you need\nextra time on exams.\n\n' +
            '1 — Show accommodation letter\n' +
            '2 — Say "I just need more time"\n' +
            '3 — Stay silent and walk away'
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
            this.gameState.choices.push('Showed accommodation letter ✓');
            this.feedbackText.setText('✓ The professor nods and approves your accommodations!');
            this.closeChoiceMenu();
            this.time.delayedCall(1500, () => {
                this.scene.start('WinScene', {
                    score: this.gameState.score,
                    choices: this.gameState.choices,
                    level: 2
                });
            });
        }

        if (Phaser.Input.Keyboard.JustDown(this.twoKey)) {
            this.gameState.anxiety = Math.min(100, this.gameState.anxiety + 20);
            this.gameState.choices.push('"I just need more time" ✗');
            this.feedbackText.setText('✗ The professor says you need official documentation.');
            this.closeChoiceMenu();
            this.checkAnxiety();
        }

        if (Phaser.Input.Keyboard.JustDown(this.threeKey)) {
            this.gameState.anxiety = Math.min(100, this.gameState.anxiety + 35);
            this.gameState.choices.push('Walked away silently ✗');
            this.feedbackText.setText('✗ Avoiding the situation made things harder.');
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