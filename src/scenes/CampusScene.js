class CampusScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CampusScene' });
    }

    preload() {
        this.load.atlas('anna', 'assets/anna.png', 'assets/anna.json');
        this.load.atlas('lu', 'assets/lu.png', 'assets/lu.json');
        this.load.atlas('bg-classroom', 'assets/background.png', 'assets/background.json');
        this.load.image('ledge', 'assets/ledge.png');

        this.load.on('filecomplete-atlas-anna', () => {
            this.textures.get('anna').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });
        this.load.on('filecomplete-atlas-lu', () => {
            this.textures.get('lu').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });
        this.load.on('filecomplete-atlas-bg-classroom', () => {
            this.textures.get('bg-classroom').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });

        this.load.svg('sign-boylan', 'assets/Boylan.svg');
        this.load.svg('sign-ingersoll', 'assets/Ingersoll.svg');

        this.load.audio('music', 'assets/sounds/menuMusic1.mp3');
        this.load.audio('jump', 'assets/sounds/jump1.wav');
        this.load.audio('walk', 'assets/sounds/walking1.wav');
    }

    create(data) {
        this.gameState = {
            level: 2,
            objective: 'Collect all tokens, then find the correct door',
            score: data?.score || 0,
            anxiety: data?.anxiety || 0,
            choices: [],
            interactionCooldown: false,
            allTokensComplete: false
        };

        this.currentCharacter = data?.character || 'anna';
        this.correctDoor = 'right'; // Ingersoll Hall (Door B) is always correct
        this.isNearDoor = null;
        this.isChoosing = false;
        this.isAnswering = false;
        this.questionsCompleted = 0;
        this.totalQuestions = 3;
        this.currentQuestion = null;
        this.questionCooldown = false;
        this.playerDir = 'right';

        this._prefetchedQuestion = null;
        this._prefetchInProgress = false;
        this._discardPrefetch = false;

        this.buildBackground();
        this.buildPlatforms();
        this.buildPlayer();
        this.buildAnimations();
        this.buildDoors();
        this.buildUI();
        this.buildPauseMenu();
        this.buildQuestionUI();
        this.buildTokens();
        this.buildTunnelVision();
        this.setupControls();
        this.setupColliders();

        this.musicSound = this.sound.add('music', { loop: true, volume: 0.4 });
        this.musicSound.play();

        this.jumpSound = this.sound.add('jump', { volume: 0.6 });
        this.walkSound = this.sound.add('walk', { loop: true, volume: 0.4 });

        this.events.once('shutdown', () => {
            this.musicSound.stop();
            this.walkSound.stop();
        });

        this.player.anims.play(`${this.currentCharacter}-idle`);
        this.playNarration('Collect three question tokens, then find the correct door.');
        this._prefetchNext();
    }

    // ─── Background ───────────────────────────────────────────────────────────

    buildBackground() {
        if (!this.anims.exists('bg-classroom-anim')) {
            this.anims.create({
                key: 'bg-classroom-anim',
                frames: [
                    { key: 'bg-classroom', frame: 'Sprite-0002 0.' },
                    { key: 'bg-classroom', frame: 'Sprite-0002 1.' },
                    { key: 'bg-classroom', frame: 'Sprite-0002 2.' },
                    { key: 'bg-classroom', frame: 'Sprite-0002 3.' }
                ],
                frameRate: 4,
                repeat: -1
            });
        }

        this.bgSprite = this.add.sprite(400, 300, 'bg-classroom', 'Sprite-0002 0.')
            .setScale(10)
            .setDepth(0);
        this.bgSprite.play('bg-classroom-anim');
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

        // Ground (invisible, collision only)
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

    // ─── Doors ────────────────────────────────────────────────────────────────

    buildDoors() {
        // Left door — Boylan Hall
        this.leftDoor = this.add.rectangle(60, 474, 44, 64, 0x8b5e3c).setDepth(5);
        this.leftDoor.setStrokeStyle(3, 0x4a2a0a);
        this.add.rectangle(72, 474, 8, 8, 0xffd700).setDepth(6); // knob
        this.add.image(60, 420, 'sign-boylan')
            .setAngle(-90)
            .setScale(0.04)
            .setDepth(6);

        // Right door — Ingersoll Hall
        this.rightDoor = this.add.rectangle(740, 474, 44, 64, 0x8b5e3c).setDepth(5);
        this.rightDoor.setStrokeStyle(3, 0x4a2a0a);
        this.add.rectangle(728, 474, 8, 8, 0xffd700).setDepth(6); // knob
        this.add.image(740, 420, 'sign-ingersoll')
            .setAngle(-90)
            .setScale(0.04)
            .setDepth(6);
    }

    // ─── Pause Menu ───────────────────────────────────────────────────────────

    buildPauseMenu() {
        const depth = 600;

        this.pauseOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.75)
            .setDepth(depth).setVisible(false);

        this.pausePanel = this.add.rectangle(400, 305, 320, 260, 0x111122, 1)
            .setDepth(depth + 1).setVisible(false)
            .setStrokeStyle(2, 0xaaddff);

        this.pauseTitle = this.add.text(400, 208, 'PAUSED', {
            fontSize: '22px', fill: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(depth + 2).setVisible(false);

        this.pauseContinueBtn = this.add.rectangle(400, 260, 200, 36, 0x224488)
            .setDepth(depth + 2).setVisible(false).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.resumeGame())
            .on('pointerover', function() { this.setFillStyle(0x3366cc); })
            .on('pointerout',  function() { this.setFillStyle(0x224488); });
        this.pauseContinueText = this.add.text(400, 260, 'Continue', {
            fontSize: '16px', fill: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(depth + 3).setVisible(false);

        // Volume row
        this.pauseVolLabel = this.add.text(252, 312, 'MUSIC VOL', {
            fontSize: '13px', fill: '#aaddff', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setDepth(depth + 2).setVisible(false);

        this.pauseVolMinBtn = this.add.rectangle(418, 312, 26, 26, 0x334455)
            .setDepth(depth + 2).setVisible(false).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this._adjustVolume(-0.1))
            .on('pointerover', function() { this.setFillStyle(0x446677); })
            .on('pointerout',  function() { this.setFillStyle(0x334455); });
        this.pauseVolMinText = this.add.text(418, 312, '−', {
            fontSize: '16px', fill: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(depth + 3).setVisible(false);

        this.pauseVolText = this.add.text(450, 312, '40%', {
            fontSize: '13px', fill: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(depth + 3).setVisible(false);

        this.pauseVolPlusBtn = this.add.rectangle(484, 312, 26, 26, 0x334455)
            .setDepth(depth + 2).setVisible(false).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this._adjustVolume(0.1))
            .on('pointerover', function() { this.setFillStyle(0x446677); })
            .on('pointerout',  function() { this.setFillStyle(0x334455); });
        this.pauseVolPlusText = this.add.text(484, 312, '+', {
            fontSize: '16px', fill: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(depth + 3).setVisible(false);

        this.pauseEndBtn = this.add.rectangle(400, 366, 200, 36, 0x882222)
            .setDepth(depth + 2).setVisible(false).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('TitleScene'))
            .on('pointerover', function() { this.setFillStyle(0xcc3333); })
            .on('pointerout',  function() { this.setFillStyle(0x882222); });
        this.pauseEndText = this.add.text(400, 366, 'End Game', {
            fontSize: '16px', fill: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(depth + 3).setVisible(false);

        this.menuBtn = this.add.rectangle(770, 18, 56, 22, 0x224488)
            .setDepth(depth).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.togglePause())
            .on('pointerover', function() { this.setFillStyle(0x3366cc); })
            .on('pointerout',  function() { this.setFillStyle(0x224488); });
        this.add.text(770, 18, 'MENU', {
            fontSize: '11px', fill: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(depth + 1);
    }

    _adjustVolume(delta) {
        const newVol = Math.max(0, Math.min(1, this.musicSound.volume + delta));
        this.musicSound.setVolume(newVol);
        this.pauseVolText.setText(`${Math.round(newVol * 100)}%`);
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
        this.pauseVolText.setText(`${Math.round(this.musicSound.volume * 100)}%`);
        [this.pauseOverlay, this.pausePanel, this.pauseTitle,
         this.pauseContinueBtn, this.pauseContinueText,
         this.pauseVolLabel, this.pauseVolMinBtn, this.pauseVolMinText,
         this.pauseVolText, this.pauseVolPlusBtn, this.pauseVolPlusText,
         this.pauseEndBtn, this.pauseEndText].forEach(o => o.setVisible(true));
    }

    resumeGame() {
        this.isPaused = false;
        [this.pauseOverlay, this.pausePanel, this.pauseTitle,
         this.pauseContinueBtn, this.pauseContinueText,
         this.pauseVolLabel, this.pauseVolMinBtn, this.pauseVolMinText,
         this.pauseVolText, this.pauseVolPlusBtn, this.pauseVolPlusText,
         this.pauseEndBtn, this.pauseEndText].forEach(o => o.setVisible(false));
    }

    // ─── UI ───────────────────────────────────────────────────────────────────

    buildUI() {
        // Reuse the same HTML stats panel as MainScene
        this._domObjective = document.getElementById('stats-objective');
        this._domScore     = document.getElementById('stats-score');
        this._domBar       = document.getElementById('stats-bar');
        this._domPct       = document.getElementById('stats-pct');
        this._domFeedback  = document.getElementById('stats-feedback');
        this._domQuestText = document.getElementById('quest-bar-text');

        this._domObjective.textContent = `▶ ${this.gameState.objective}`;
        this._domScore.textContent     = `SCORE: ${this.gameState.score}`;
        this._domFeedback.textContent  = 'Press H for help';
        this._domQuestText.textContent = `Collect questions: 0 / ${this.totalQuestions}`;
        this._domQuestText.style.color = '';

        document.getElementById('stats-html').style.display     = 'block';
        document.getElementById('quest-bar-html').style.display = 'flex';

        this.events.once('shutdown', () => {
            document.getElementById('stats-html').style.display     = 'none';
            document.getElementById('quest-bar-html').style.display = 'none';
        });

        // Interact prompt fixed at top-center so it's always outside the tunnel
        this.interactText = this.add.text(400, 555, '', {
            fontSize: '15px',
            fill: '#ffff99',
            fontFamily: 'monospace',
            backgroundColor: '#000000aa',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(600);
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
        this.physics.add.overlap(this.player, this.tokens, (player, token) => this.collectToken(player, token));
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    update() {
        if (this.isPaused) return;
        this.handleMovement();
        this.handleDoorInteraction();
        this.handleQuestionInput();
        this.updateTunnelVision();
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

    handleDoorInteraction() {
        if (this.isChoosing || this.isAnswering || this.gameState.interactionCooldown) return;

        const distLeft = Phaser.Math.Distance.Between(
            this.player.x, this.player.y, this.leftDoor.x, this.leftDoor.y
        );
        const distRight = Phaser.Math.Distance.Between(
            this.player.x, this.player.y, this.rightDoor.x, this.rightDoor.y
        );

        if (!this.gameState.allTokensComplete) {
            if (distLeft < 80 || distRight < 80) {
                this.interactText.setText('Collect all ? tokens first!');
            } else {
                this.interactText.setText('');
            }
            return;
        }

        if (distLeft < 80) {
            this.isNearDoor = 'left';
            this.interactText.setText('[ Press E to enter Boylan Hall ]');
        } else if (distRight < 80) {
            this.isNearDoor = 'right';
            this.interactText.setText('[ Press E to enter Ingersoll Hall ]');
        } else {
            this.isNearDoor = null;
            this.interactText.setText('');
        }

        if (this.isNearDoor && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            this.enterDoor(this.isNearDoor);
        }

        if (Phaser.Input.Keyboard.JustDown(this.helpKey)) {
            this._domFeedback.textContent = 'HELP: Answer all tokens, then pick the correct door!';
        }
    }

    enterDoor(side) {
        this.isChoosing = true;
        if (side === this.correctDoor) {
            this.gameState.score += 100;
            this.gameState.choices.push(`Door ${side === 'left' ? 'A' : 'B'} \u2713`);
            this._domFeedback.textContent = '✓ Correct door! You found the way out!';
            this.time.delayedCall(1500, () => {
                this.scene.start('WinScene', {
                    score: this.gameState.score,
                    choices: this.gameState.choices,
                    character: this.currentCharacter,
                    level: 2
                });
            });
        } else {
            this.gameState.anxiety = Math.min(100, this.gameState.anxiety + 25);
            this.gameState.choices.push(`Door ${side === 'left' ? 'A' : 'B'} \u2717`);
            this._domFeedback.textContent = '✗ Wrong door! Anxiety +25%.';
            this.isChoosing = false;
            this.gameState.interactionCooldown = true;
            this.time.delayedCall(2000, () => {
                this.gameState.interactionCooldown = false;
            });
            this.checkAnxiety();
        }
    }

    checkAnxiety() {
        if (this.gameState.anxiety >= 100) {
            this.time.delayedCall(1000, () => {
                this.scene.start('TitleScene');
            });
        }
    }

    updateUI() {
        this._domScore.textContent = `SCORE: ${this.gameState.score}`;
        const pct = this.gameState.anxiety;
        this._domBar.style.width      = `${pct}%`;
        this._domBar.style.background = pct < 50 ? '#ffaa00' : '#ff2222';
        this._domPct.textContent      = `${pct}%`;
    }

    // ─── Tunnel Vision ────────────────────────────────────────────────────────

    buildTunnelVision() {
        this.tunnelDark = this.add.graphics().setDepth(500);
        this.tunnelMask = this.make.graphics({ add: false });
        const mask = new Phaser.Display.Masks.GeometryMask(this, this.tunnelMask);
        mask.invertAlpha = true;
        this.tunnelDark.setMask(mask);
    }

    updateTunnelVision() {
        if (this.isAnswering || this.isChoosing) {
            this.tunnelDark.setVisible(false);
            return;
        }
        this.tunnelDark.setVisible(true);
        this.tunnelDark.clear();
        this.tunnelDark.fillStyle(0x000000, 0.88);
        this.tunnelDark.fillRect(0, 0, 800, 600);
        this.tunnelMask.clear();
        this.tunnelMask.fillStyle(0xffffff, 1);
        this.tunnelMask.fillCircle(this.player.x, this.player.y, 70);
    }

    // ─── Tokens ───────────────────────────────────────────────────────────────

    buildTokens() {
        this.tokens = this.physics.add.staticGroup();

        const positions = [
            { x: 600, y: 398 },
            { x: 200, y: 278 },
            { x: 750, y: 238 },
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

        // quest text is now the HTML quest-bar
    }

    // ─── Question UI ──────────────────────────────────────────────────────────

    buildQuestionUI() {
        this._qOverlay = document.getElementById('question-html');
        this._qText    = document.getElementById('question-html-text');
        this._qOptions = document.getElementById('question-html-options');
        this._qResult  = document.getElementById('question-html-result');
        this._qTimer   = document.getElementById('question-html-timer');
        this._qTimerBar = document.getElementById('question-html-timer-bar');
        this._questionTimer = null;
    }

    _startQuestionTimer() {
        this._clearQuestionTimer();
        const TOTAL = 30;
        let remaining = TOTAL;
        this._qTimer.textContent = remaining;
        this._qTimer.className = '';
        this._qTimer.style.display = 'block';
        this._qTimerBar.style.width = '100%';
        this._qTimerBar.style.display = 'block';
        this._questionTimer = setInterval(() => {
            remaining--;
            this._qTimer.textContent = remaining;
            this._qTimerBar.style.width = `${(remaining / TOTAL) * 100}%`;
            if (remaining <= 10) this._qTimer.classList.add('urgent');
            if (remaining <= 0) {
                this._clearQuestionTimer();
                this._onQuestionClose();
            }
        }, 1000);
    }

    _clearQuestionTimer() {
        if (this._questionTimer) {
            clearInterval(this._questionTimer);
            this._questionTimer = null;
        }
        if (this._qTimer) {
            this._qTimer.style.display = 'none';
            this._qTimer.className = '';
        }
        if (this._qTimerBar) {
            this._qTimerBar.style.display = 'none';
        }
    }

    // ─── Token Collection & Questions ─────────────────────────────────────────

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
            duration: 500, yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    async _prefetchNext() {
        if (this._prefetchInProgress || this._prefetchedQuestion) return;
        this._prefetchInProgress = true;
        this._discardPrefetch = false;
        try {
            const res = await fetch(`http://localhost:8080/api/question?scene=classroom&t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            if (!this._discardPrefetch) {
                this._prefetchedQuestion = data;
            }
        } catch (e) {
            // silently ignore
        } finally {
            this._prefetchInProgress = false;
            this._discardPrefetch = false;
        }
    }

    async fetchQuestion() {
        this._fetchCancelled = false;
        if (this._prefetchedQuestion) {
            const data = this._prefetchedQuestion;
            this._prefetchedQuestion = null;
            this.currentQuestion = data;
            this.showQuestion(data);
            return;
        }
        this._discardPrefetch = true;
        this.showQuestionLoading();
        try {
            const res = await fetch(`http://localhost:8080/api/question?scene=classroom&t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            if (this._fetchCancelled) return;
            this.currentQuestion = data;
            this.showQuestion(data);
        } catch (e) {
            if (this._fetchCancelled) return;
            const fallbacks = [
                { question: 'What is an accommodation in an educational setting?', options: ['Extra homework', 'Adjustments that support equal access', 'A different grade scale', 'Optional attendance'], correct: 1 },
                { question: 'Which document helps students get classroom accommodations?', options: ['A doctor\'s prescription', 'A disability services letter', 'A parent permission slip', 'A teacher\'s note'], correct: 1 },
                { question: 'What does "inclusive education" mean?', options: ['Only gifted students', 'All students learn together with support', 'Separate classrooms for disabilities', 'Online-only learning'], correct: 1 },
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
        this._startQuestionTimer();
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
        if (!this._questionTimer) this._startQuestionTimer();
    }

    _randomTokenPos() {
        const spots = [
            { x: 150, y: 395 }, { x: 300, y: 295 }, { x: 420, y: 480 },
            { x: 80,  y: 510 }, { x: 230, y: 510 }, { x: 400, y: 510 },
            { x: 150, y: 295 }, { x: 300, y: 395 },
        ];
        return spots[Math.floor(Math.random() * spots.length)];
    }

    _onQuestionClose() {
        this._clearQuestionTimer();
        if (this._questionAnswered) {
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
        this._clearQuestionTimer();
        this.isAnswering = false;
        this.currentQuestion = null;
        this.questionCooldown = false;
        this._qOverlay.style.display = 'none';

        this.questionsCompleted++;
        this._domQuestText.textContent = `Collect questions: ${this.questionsCompleted} / ${this.totalQuestions}`;
        this._domQuestText.style.color = '';
        if (this.questionsCompleted >= this.totalQuestions) {
            this.gameState.allTokensComplete = true;
            this._domQuestText.textContent = 'All done! Find Ingersoll Hall. ✔';
            this._domQuestText.style.color = '#44ff88';
            this.playNarration('All done! Find Ingersoll Hall.');
        }

        this._prefetchNext();
    }

    // ─── TTS Narration ────────────────────────────────────────────────────────

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
            this.narrationAudio.play().catch(() => {});
        } catch (e) {}
    }
}