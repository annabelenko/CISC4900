class ClassroomScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ClassroomScene' });
    }

    preload() {
        this.load.atlas('anna', 'assets/anna.png', 'assets/anna.json');
        this.load.atlas('lu', 'assets/lu.png', 'assets/lu.json');
        this.load.atlas('bg-classroom', 'assets/background.png', 'assets/background.json');

        this.load.on('filecomplete-atlas-anna', () => {
            this.textures.get('anna').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });
        this.load.on('filecomplete-atlas-lu', () => {
            this.textures.get('lu').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });
        this.load.on('filecomplete-atlas-bg-classroom', () => {
            this.textures.get('bg-classroom').setFilter(Phaser.Textures.FilterMode.NEAREST);
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
        this.buildProfessor();
        this.buildUI();
        this.buildQuestionUI();
        this.buildTokens();
        this.buildTunnelVision();
        this.setupControls();
        this.setupColliders();

        this.player.anims.play(`${this.currentCharacter}-idle`);
        this.playNarration('Collect three question tokens, then find the professor.');
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

        const addPlat = (x, y, w, h, color) => {
            const p = this.add.rectangle(x, y, w, h, color);
            this.physics.add.existing(p, true);
            p.body.setSize(w, h);
            p.body.reset(x, y);
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
        this.fourKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
    }

    setupColliders() {
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.overlap(this.player, this.tokens, (player, token) => this.collectToken(player, token));
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    update() {
        this.handleMovement();
        this.handleProfessorInteraction();
        this.handleChoices();
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

    handleProfessorInteraction() {
        if (this.isChoosing || this.gameState.interactionCooldown) return;

        const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.professor.x, this.professor.y
        );

        if (dist < 100) {
            this.isNearProfessor = true;
            if (this.questionsCompleted >= this.totalQuestions) {
                this.interactText.setText('[ Press E to talk to professor ]');
            } else {
                this.interactText.setText(`Collect all ${this.totalQuestions} question tokens first!`);
            }
        } else {
            this.isNearProfessor = false;
            this.interactText.setText('');
        }

        if (this.isNearProfessor && this.questionsCompleted >= this.totalQuestions && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
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
                    choices: this.gameState.choices,
                    character: this.currentCharacter
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
            { x: 150, y: 395 },
            { x: 300, y: 295 },
            { x: 420, y: 480 },
        ];

        positions.forEach((pos, i) => {
            const token = this.add.circle(pos.x, pos.y, 10, 0x00ccff);
            token.setDepth(10);
            this.physics.add.existing(token, true);
            this.tokens.add(token);

            const label = this.add.text(pos.x, pos.y - 18, '?', {
                fontSize: '14px', fill: '#ffffff', fontFamily: 'monospace'
            }).setOrigin(0.5).setDepth(11);
            token.label = label;

            this.tweens.add({
                targets: [token, label],
                y: '-=6',
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        this.questText = this.add.text(20, 104, `Collect questions: 0 / ${this.totalQuestions}`, {
            fontSize: '13px', fill: '#aaddff', fontFamily: 'monospace'
        }).setDepth(10);
    }

    // ─── Question UI ──────────────────────────────────────────────────────────

    buildQuestionUI() {
        this._qOverlay = document.getElementById('question-html');
        this._qText    = document.getElementById('question-html-text');
        this._qOptions = document.getElementById('question-html-options');
        this._qResult  = document.getElementById('question-html-result');
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
        const token = this.add.circle(x, y, 10, 0x00ccff);
        token.setDepth(10);
        this.physics.add.existing(token, true);
        this.tokens.add(token);
        const label = this.add.text(x, y - 18, '?', {
            fontSize: '14px', fill: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(11);
        token.label = label;
        token._tween = this.tweens.add({
            targets: [token, label],
            y: '-=6', duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
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
        const spots = [
            { x: 150, y: 395 }, { x: 300, y: 295 }, { x: 420, y: 480 },
            { x: 80,  y: 510 }, { x: 230, y: 510 }, { x: 400, y: 510 },
            { x: 150, y: 295 }, { x: 300, y: 395 },
        ];
        return spots[Math.floor(Math.random() * spots.length)];
    }

    _onQuestionClose() {
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
        this.isAnswering = false;
        this.currentQuestion = null;
        this.questionCooldown = false;
        this._qOverlay.style.display = 'none';

        this.questionsCompleted++;
        this.questText.setText(`Collect questions: ${this.questionsCompleted} / ${this.totalQuestions}`);

        if (this.questionsCompleted >= this.totalQuestions) {
            this.questText.setText('All done! Now find the professor. ✔').setStyle({ fill: '#44ff88' });
            this.playNarration('All done! Now find the professor.');
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