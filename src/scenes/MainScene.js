class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.atlas('anna', 'assets/anna.png', 'assets/anna.json');
        this.load.atlas('lu', 'assets/lu.png', 'assets/lu.json');
        this.load.atlas('guard', 'assets/guard.png', 'assets/guard.json');
        this.load.image('ledge', 'assets/ledge.png');
        this.load.image('scene1', 'assets/scene1.png');

        this.load.on('filecomplete-atlas-anna', () => {
            this.textures.get('anna').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });
        this.load.on('filecomplete-atlas-lu', () => {
            this.textures.get('lu').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });
        this.load.on('filecomplete-atlas-guard', () => {
            this.textures.get('guard').setFilter(Phaser.Textures.FilterMode.NEAREST);
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

        this.isPaused = false;

        this.questionsCompleted = 0;
        this.totalQuestions = 5;

        this._prefetchedQuestion = null;
        this._prefetchInProgress = false;
        this._discardPrefetch = false;

        this.buildBackground();
        this.buildPlatforms();
        this.buildTokens();
        this.buildPlayer();
        this.buildAnimations();
        this.buildGuard();
        this.buildUI();
        this.buildQuestionUI();
        this.buildPauseMenu();
        this.setupControls();
        this.setupColliders();
        this.buildTunnelVision();

        this.player.anims.play('anna-idle');

        // Play opening narration
        this.playNarration('Collect all five question tokens, then find the security guard.');

        // Pre-fetch first question immediately so it's ready
        this._prefetchNext();
    }

    // ─── Narration ────────────────────────────────────────────────────────────

    async playNarration(text) {
        try {
            const res = await fetch('http://localhost:8080/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (!res.ok) return;
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            this.narrationAudio = new Audio(url);
            this.narrationAudio.play().catch(e => console.warn('Narration play failed:', e));
        } catch (e) {
            console.warn('TTS unavailable:', e);
        }
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
        if (this.isAnswering || this.isChoosing || this.isPaused) {
            this.tunnelDark.setVisible(false);
            return;
        }
        this.tunnelDark.setVisible(true);
        this.tunnelMask.clear();
        this.tunnelMask.fillStyle(0xffffff, 1);
        this.tunnelMask.fillCircle(this.player.x, this.player.y, 70);
    }

    // ─── Pause Menu ───────────────────────────────────────────────────────────

    buildPauseMenu() {
        const depth = 600;

        // Dim overlay
        this.pauseOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.75)
            .setDepth(depth).setVisible(false);

        // Panel
        this.pausePanel = this.add.rectangle(400, 300, 320, 200, 0x111122, 1)
            .setDepth(depth + 1).setVisible(false)
            .setStrokeStyle(2, 0xaaddff);

        this.pauseTitle = this.add.text(400, 230, 'PAUSED', {
            fontSize: '22px', fill: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(depth + 2).setVisible(false);

        // Continue button
        this.pauseContinueBtn = this.add.rectangle(400, 290, 200, 36, 0x224488)
            .setDepth(depth + 2).setVisible(false).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.resumeGame())
            .on('pointerover', function() { this.setFillStyle(0x3366cc); })
            .on('pointerout',  function() { this.setFillStyle(0x224488); });
        this.pauseContinueText = this.add.text(400, 290, 'Continue', {
            fontSize: '16px', fill: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(depth + 3).setVisible(false);

        // End game button
        this.pauseEndBtn = this.add.rectangle(400, 345, 200, 36, 0x882222)
            .setDepth(depth + 2).setVisible(false).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('TitleScene'))
            .on('pointerover', function() { this.setFillStyle(0xcc3333); })
            .on('pointerout',  function() { this.setFillStyle(0x882222); });
        this.pauseEndText = this.add.text(400, 345, 'End Game', {
            fontSize: '16px', fill: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(depth + 3).setVisible(false);

        // Menu button (top-right corner)
        this.menuBtn = this.add.rectangle(770, 18, 56, 22, 0x224488)
            .setDepth(depth).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.togglePause())
            .on('pointerover', function() { this.setFillStyle(0x3366cc); })
            .on('pointerout',  function() { this.setFillStyle(0x224488); });
        this.add.text(770, 18, 'MENU', {
            fontSize: '11px', fill: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(depth + 1);
    }

    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    pauseGame() {
        this.isPaused = true;
        this.player.body.setVelocity(0, 0);
        [this.pauseOverlay, this.pausePanel, this.pauseTitle,
         this.pauseContinueBtn, this.pauseContinueText,
         this.pauseEndBtn, this.pauseEndText].forEach(o => o.setVisible(true));
    }

    resumeGame() {
        this.isPaused = false;
        [this.pauseOverlay, this.pausePanel, this.pauseTitle,
         this.pauseContinueBtn, this.pauseContinueText,
         this.pauseEndBtn, this.pauseEndText].forEach(o => o.setVisible(false));
    }

    // ─── Background ───────────────────────────────────────────────────────────

    buildBackground() {
        // Background image scaled to fill the canvas
        this.add.image(400, 300, 'scene1').setDisplaySize(800, 600).setDepth(0);


    }

    // ─── Platforms ────────────────────────────────────────────────────────────

    buildPlatforms() {
        this.platforms = this.physics.add.staticGroup();

        const addPlat = (x, y, w, h) => {
            const p = this.add.image(x, y, 'ledge').setDisplaySize(w, h);
            this.physics.add.existing(p, true);
            p.body.setSize(w, h);
            p.body.reset(x, y);
            this.platforms.add(p);
        };

        // Ground uses a plain rectangle (invisible, collision only)
        const ground = this.add.rectangle(400, 536, 800, 32, 0x000000, 0);
        this.physics.add.existing(ground, true);
        ground.body.setSize(800, 32);
        ground.body.reset(400, 536);
        this.platforms.add(ground);

        addPlat(600, 420, 200, 20);
        addPlat(200, 300, 200, 20);
        addPlat(750, 260, 160, 20);
        addPlat(330, 370, 80, 14);
        addPlat(430, 330, 60, 14);
        addPlat(520, 240, 70, 14);
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

        this.anims.create({
            key: 'guard-idle',
            frames: [
                { key: 'guard', frame: 'Sprite-0005 0.' },
                { key: 'guard', frame: 'Sprite-0005 1.' }
            ],
            frameRate: 2, repeat: -1
        });
    }

    // ─── Guard ────────────────────────────────────────────────────────────────

    buildGuard() {
        this.guard = this.add.sprite(690, 480, 'guard', 'Sprite-0005 0.');
        this.guard.setScale(2.5);
        this.guard.play('guard-idle');
        this.add.text(690, 523, 'GUARD', {
            fontSize: '11px', fill: '#aabbcc', fontFamily: 'monospace'
        }).setOrigin(0.5, 0);
    }

    // ─── UI ───────────────────────────────────────────────────────────────────

    buildUI() {
        // Stats panel: use HTML DOM so text is selectable
        this._domObjective = document.getElementById('stats-objective');
        this._domScore     = document.getElementById('stats-score');
        this._domBar       = document.getElementById('stats-bar');
        this._domPct       = document.getElementById('stats-pct');
        this._domFeedback  = document.getElementById('stats-feedback');
        this._domQuestText = document.getElementById('quest-bar-text');

        // Initialise values
        this._domObjective.textContent = `▶ ${this.gameState.objective}`;
        this._domScore.textContent     = `SCORE: ${this.gameState.score}`;
        this._domFeedback.textContent  = 'Press H for help';
        this._domQuestText.textContent = `Complete all questions: 0 / ${this.totalQuestions}`;
        this._domQuestText.style.color = '';

        // Show the panels
        document.getElementById('stats-html').style.display     = 'block';
        document.getElementById('quest-bar-html').style.display = 'flex';

        // Hide panels when scene shuts down
        this.events.once('shutdown', () => {
            document.getElementById('stats-html').style.display     = 'none';
            document.getElementById('quest-bar-html').style.display = 'none';
        });

        // Phaser objects still needed for in-world interaction prompts
        this.interactText = this.add.text(400, 410, '', {
            fontSize: '15px', fill: '#ffff99', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(510);

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
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());
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
        if (this.isPaused) return;
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
            if (this.questionsCompleted < this.totalQuestions) {
                this.interactText.setText('Complete all questions first!');
            } else {
                this.interactText.setText('[ Press E to interact ]');
            }
        } else {
            this.isNearGuard = false;
            this.interactText.setText('');
        }

        if (this.isNearGuard && this.questionsCompleted >= this.totalQuestions && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            this.openChoiceMenu();
        }

        if (Phaser.Input.Keyboard.JustDown(this.helpKey)) {
            this._domFeedback.textContent = 'HELP: Walk to the guard and press E. Show the right ID!';
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
        this._domFeedback.textContent = 'Make your choice...';
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
            this._domFeedback.textContent = '✓ Correct! The guard lets you through.';
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
            this._domFeedback.textContent = '✗ A credit card is not valid ID here.';
            this.closeChoiceMenu();
            this.checkAnxiety();
        }

        if (Phaser.Input.Keyboard.JustDown(this.threeKey)) {
            this.gameState.anxiety = Math.min(100, this.gameState.anxiety + 10);
            this.gameState.choices.push('Library Card ✗');
            this._domFeedback.textContent = '✗ A library card won\'t work here.';
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
        this._qOverlay = document.getElementById('question-html');
        this._qText    = document.getElementById('question-html-text');
        this._qOptions = document.getElementById('question-html-options');
        this._qResult  = document.getElementById('question-html-result');
    }

    async _prefetchNext() {
        if (this._prefetchInProgress || this._prefetchedQuestion) return;
        this._prefetchInProgress = true;
        this._discardPrefetch = false;
        try {
            const res = await fetch(`http://localhost:8080/api/question?t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            // Discard if a direct fetch already claimed this slot
            if (!this._discardPrefetch) {
                this._prefetchedQuestion = data;
            }
        } catch (e) {
            // silently ignore — fetchQuestion will handle fallback
        } finally {
            this._prefetchInProgress = false;
            this._discardPrefetch = false;
        }
    }

    collectToken(player, token) {
        if (this.isAnswering) return;
        this._pendingTokenPos = { x: token.x, y: token.y };
        if (token.label) token.label.destroy();
        if (token._tween) token._tween.stop();
        token.destroy();
        this.isAnswering = true;
        this.player.body.setVelocity(0, 0);
        this.fetchQuestion();
    }

    _spawnToken(x, y) {
        const token = this.add.rectangle(x, y, 24, 24, 0xffdd00);
        token.setStrokeStyle(2, 0xff8800);
        this.physics.add.existing(token, true);
        token.body.setSize(24, 24);
        token.body.reset(x, y);
        this.tokens.add(token);
        const label = this.add.text(x, y, '?', {
            fontSize: '16px', fill: '#885500', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);
        token.label = label;
        token._tween = this.tweens.add({
            targets: [token, label],
            scaleX: 1.2, scaleY: 1.2,
            duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
    }

    async fetchQuestion() {
        this._fetchCancelled = false;
        // Use pre-fetched question if available (instant)
        if (this._prefetchedQuestion) {
            const data = this._prefetchedQuestion;
            this._prefetchedQuestion = null;
            this.currentQuestion = data;
            this.showQuestion(data);
            return;
        }
        // Tell any in-flight prefetch to discard its result (we're fetching directly)
        this._discardPrefetch = true;
        this.showQuestionLoading();
        try {
            const res = await fetch(`http://localhost:8080/api/question?t=${Date.now()}`, {
                cache: 'no-store'
            });
            const data = await res.json();
            if (this._fetchCancelled) return;
            this.currentQuestion = data;
            this.showQuestion(data);
        } catch (e) {
            if (this._fetchCancelled) return;
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
        this._qText.textContent = 'Loading question...';
        this._qOptions.innerHTML = '';
        this._qResult.textContent = '';
        this._qResult.className = '';
        this._questionAnswered = false;
        const closeBtn = document.getElementById('question-html-close');
        closeBtn.disabled = false;
        closeBtn.style.opacity = '1';
        closeBtn.onclick = () => this._onQuestionClose();
        this._qOverlay.style.display = 'flex';
    }

    showQuestion(data) {
        this._qText.textContent = data.question;
        this._qOptions.innerHTML = '';
        data.options.forEach((opt, i) => {
            const div = document.createElement('div');
            div.className = 'q-option';
            div.textContent = `${i + 1} — ${opt}`;
            div.addEventListener('click', () => this.submitAnswer(i));
            this._qOptions.appendChild(div);
        });
        this._qResult.textContent = '';
        this._qResult.className = '';
        const closeBtn = document.getElementById('question-html-close');
        closeBtn.disabled = false;
        closeBtn.style.opacity = '1';
        closeBtn.onclick = () => this._onQuestionClose();
        this._questionAnswered = false;
        this._qOverlay.style.display = 'flex';
    }

    _randomTokenPos() {
        // Valid positions on top of each platform
        const spots = [
            { x: 600, y: 398 }, { x: 200, y: 278 }, { x: 750, y: 238 },
            { x: 330, y: 351 }, { x: 430, y: 311 }, { x: 520, y: 221 },
            { x: 100, y: 510 }, { x: 400, y: 510 }, { x: 680, y: 510 },
        ];
        return spots[Math.floor(Math.random() * spots.length)];
    }

    _onQuestionClose() {
        if (this._questionAnswered) {
            // Already answered — just dismiss early
            this.closeQuestion();
        } else {
            // Not answered (or still loading) — cancel fetch, hide overlay, spawn token at random spot after 5s
            this._fetchCancelled = true;
            this._qOverlay.style.display = 'none';
            this.isAnswering = false;
            this.currentQuestion = null;
            this._pendingTokenPos = null;
            this.time.delayedCall(5000, () => {
                const pos = this._randomTokenPos();
                this._spawnToken(pos.x, pos.y);
            });
        }
    }

    submitAnswer(i) {
        if (!this.isAnswering || !this.currentQuestion || this.questionCooldown) return;
        this._questionAnswered = true;
        const correct = i === this.currentQuestion.correct;
        if (correct) {
            this.gameState.score += 50;
            this._qResult.textContent = 'Correct! +50 points';
            this._qResult.className = 'correct';
        } else {
            this.gameState.anxiety = Math.min(100, this.gameState.anxiety + 15);
            this._qResult.textContent = 'Wrong! Anxiety +15%';
            this._qResult.className = 'wrong';
            const opts = this._qOptions.querySelectorAll('.q-option');
            if (opts[this.currentQuestion.correct]) {
                opts[this.currentQuestion.correct].classList.add('correct-highlight');
            }
        }
        this.questionCooldown = true;
        this.time.delayedCall(1500, () => this.closeQuestion());
        this.checkAnxiety();
    }

    handleQuestionInput() {
        if (!this.isAnswering || !this.currentQuestion) return;
        if (this.questionCooldown) return;
        const keys = [this.oneKey, this.twoKey, this.threeKey, this.fourKey];
        for (let i = 0; i < keys.length; i++) {
            if (Phaser.Input.Keyboard.JustDown(keys[i])) {
                this.submitAnswer(i);
                break;
            }
        }
    }

    closeQuestion() {
        this.isAnswering = false;
        this.currentQuestion = null;
        this.questionCooldown = false;
        this._qOverlay.style.display = 'none';

        this.questionsCompleted++;
        this._domQuestText.textContent = `Complete all questions: ${this.questionsCompleted} / ${this.totalQuestions}`;
        this._domQuestText.style.color = '';

        if (this.questionsCompleted >= this.totalQuestions) {
            this._domQuestText.textContent = 'All done! Now find the security guard. \u2714';
            this._domQuestText.style.color = '#44ff88';
            this.playNarration('All done! Now find the security guard.');
        }

        // Start prefetching the next question while the player walks to the next token
        this._prefetchNext();
    }

    updateUI() {
        this._domScore.textContent = `SCORE: ${this.gameState.score}`;
        const pct = this.gameState.anxiety;
        this._domBar.style.width      = `${pct}%`;
        this._domBar.style.background = pct < 50 ? '#ffaa00' : '#ff2222';
        this._domPct.textContent      = `${pct}%`;
    }
}