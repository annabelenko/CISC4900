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
        this.isAnswering = false;
        this.currentQuestion = null;
        this.questionCooldown = false;

        this.buildBackground();
        this.buildPlatforms();
        this.buildTokens();
        this.buildPlayer();
        this.buildAnimations();
        this.buildGuard();
        this.buildUI();
        this.buildQuestionUI();
        this.setupControls();
        this.setupColliders();
        this.buildTunnelVision();

        this.player.anims.play('anna-idle');
    }

    // ─── Tunnel Vision ────────────────────────────────────────────────────────

    buildTunnelVision() {
        // Full-screen dark overlay
        this.tunnelDark = this.add.graphics().setDepth(500);
        this.tunnelDark.fillStyle(0x000000, 0.65);
        this.tunnelDark.fillRect(0, 0, 800, 600);

        // Circle that will be "cut out" of the overlay
        this.tunnelMask = this.add.graphics().setVisible(false);
        const mask = this.tunnelMask.createGeometryMask();
        mask.invertAlpha = true;
        this.tunnelDark.setMask(mask);
    }

    updateTunnelVision() {
        if (this.isAnswering) {
            this.tunnelDark.setVisible(false);
            return;
        }
        this.tunnelDark.setVisible(true);
        this.tunnelMask.clear();
        this.tunnelMask.fillStyle(0xffffff, 1);
        this.tunnelMask.fillCircle(this.player.x, this.player.y, 70);
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

    // ─── Tokens ──────────────────────────────────────────────────────────────

    buildTokens() {
        this.tokens = this.physics.add.staticGroup();

        const positions = [
            { x: 600, y: 398 },
            { x: 200, y: 278 },
            { x: 750, y: 238 },
            { x: 330, y: 351 },
            { x: 430, y: 311 },
        ];

        positions.forEach((pos) => {
            const token = this.add.rectangle(pos.x, pos.y, 24, 24, 0xffdd00);
            token.setStrokeStyle(2, 0xff8800);
            this.physics.add.existing(token, true);
            token.body.setSize(24, 24);
            token.body.reset(pos.x, pos.y);
            this.tokens.add(token);

            const label = this.add.text(pos.x, pos.y, '?', {
                fontSize: '16px', fill: '#885500', fontFamily: 'monospace', fontStyle: 'bold'
            }).setOrigin(0.5);
            token.label = label;

            this.tweens.add({
                targets: [token, label],
                scaleX: 1.2, scaleY: 1.2,
                duration: 500, yoyo: true, repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    // ─── Player ───────────────────────────────────────────────────────────────

    buildPlayer() {
        this.player = this.physics.add.sprite(520, 190, 'anna');
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
        this.fourKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
    }

    setupColliders() {
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.overlap(this.player, this.tokens, this.collectToken, null, this);
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
        this.handleQuestionInput();
        this.updateUI();
        this.updateTunnelVision();
    }

    handleMovement() {
        if (this.isChoosing || this.isAnswering) return;

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
        if (this.isChoosing || this.isAnswering || this.gameState.interactionCooldown) return;

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
                    choices: this.gameState.choices,
                    character: this.currentCharacter
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
                    choices: this.gameState.choices,
                    character: this.currentCharacter
                });
            });
        }
    }

    // ─── Question System ──────────────────────────────────────────────────────

    buildQuestionUI() {
         this.questionOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.75)
            .setVisible(false).setDepth(10);
        this.questionPanel = this.add.rectangle(400, 300, 560, 340, 0x111133, 0.97)
            .setStrokeStyle(3, 0x4488ff).setVisible(false).setDepth(11);
        this.questionText = this.add.text(400, 175, '', {
            fontSize: '16px', fill: '#ffffff', fontFamily: 'monospace',
            wordWrap: { width: 480 }, align: 'center', lineSpacing: 6
        }).setOrigin(0.5).setVisible(false).setDepth(12);

        this.optionTexts = [];
        for (let i = 0; i < 4; i++) {
            const t = this.add.text(190, 230 + i * 42, '', {
                fontSize: '15px', fill: '#aaddff', fontFamily: 'monospace',
                wordWrap: { width: 420 }
            }).setVisible(false).setDepth(12);
            this.optionTexts.push(t);
        }

        this.questionResultText = this.add.text(400, 430, '', {
            fontSize: '16px', fill: '#ffff99', fontFamily: 'monospace'
        }).setOrigin(0.5).setVisible(false).setDepth(12);
    }

    collectToken(player, token) {
        if (this.isAnswering) return;
        if (token.label) token.label.destroy();
        token.destroy();
        this.isAnswering = true;
        this.player.body.setVelocity(0, 0);
        this.fetchQuestion();
    }

    async fetchQuestion() {
        this.showQuestionLoading();
        try {
            const res = await fetch(`http://localhost:8080/api/question?t=${Date.now()}`, {
                cache: 'no-store'
            });
            const data = await res.json();
            this.currentQuestion = data;
            this.showQuestion(data);
        } catch (e) {
            const fallbacks = [
                { question: 'What does "accessibility" mean in a digital context?', options: ['Making websites look pretty', 'Ensuring everyone can use digital products', 'Adding more features', 'Using bright colors'], correct: 1 },
                { question: 'Which HTML element improves screen reader navigation?', options: ['<div>', '<span>', '<section>', '<aria-label>'], correct: 2 },
                { question: 'What is universal design?', options: ['Design for average users', 'Design usable by all people', 'Design for mobile only', 'Expensive design approach'], correct: 1 },
                { question: 'Which is a common barrier to accessibility?', options: ['Large buttons', 'Alt text on images', 'Missing captions on videos', 'Keyboard navigation'], correct: 2 },
                { question: 'What does WCAG stand for?', options: ['Web Content Accessibility Guidelines', 'World Computer Access Group', 'Web Creative Art Guide', 'Wireless Content Access Gateway'], correct: 0 },
            ];
            const q = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            this.currentQuestion = q;
            this.showQuestion(q);
        }
    }

    showQuestionLoading() {
        this.questionOverlay.setVisible(true);
        this.questionPanel.setVisible(true);
        this.questionText.setText('Loading question...').setVisible(true);
    }

    showQuestion(data) {
        this.questionText.setText(data.question);
        data.options.forEach((opt, i) => {
            this.optionTexts[i].setText(`${i + 1} — ${opt}`).setVisible(true);
        });
        this.questionResultText.setText('').setVisible(true);
    }

    handleQuestionInput() {
        if (!this.isAnswering || !this.currentQuestion) return;
        if (this.questionCooldown) return;

        const keys = [this.oneKey, this.twoKey, this.threeKey, this.fourKey];
        for (let i = 0; i < keys.length; i++) {
            if (Phaser.Input.Keyboard.JustDown(keys[i])) {
                const correct = i === this.currentQuestion.correct;
                if (correct) {
                    this.gameState.score += 50;
                    this.questionResultText.setText('Correct! +50 points').setStyle({ fill: '#00ff88' });
                } else {
                    this.gameState.anxiety = Math.min(100, this.gameState.anxiety + 15);
                    this.questionResultText.setText('Wrong! Anxiety +15%').setStyle({ fill: '#ff4444' });
                }
                this.questionCooldown = true;
                this.time.delayedCall(1500, () => this.closeQuestion());
                this.checkAnxiety();
                break;
            }
        }
    }

    closeQuestion() {
        this.isAnswering = false;
        this.currentQuestion = null;
        this.questionCooldown = false;
        this.questionOverlay.setVisible(false);
        this.questionPanel.setVisible(false);
        this.questionText.setVisible(false);
        this.optionTexts.forEach(t => t.setVisible(false));
        this.questionResultText.setVisible(false);
    }

    updateUI() {
        this.scoreText.setText(`SCORE: ${this.gameState.score}`);
        const barWidth = (this.gameState.anxiety / 100) * 150;
        this.anxietyBar.width = barWidth;
        this.anxietyBar.setFillStyle(this.gameState.anxiety < 50 ? 0xffaa00 : 0xff2222);
        this.anxietyLabel.setText(`${this.gameState.anxiety}%`);
    }
}