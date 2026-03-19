class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // No external assets needed
    }

    create() {
        this.gameState = {
            level: 1,
            objective: 'Show the correct ID to the security guard',
            score: 0,
            anxiety: 0,
            choices: [],
            interactionCooldown: false
        };

        this.buildBackground();
        this.buildUI();
        this.buildPlatforms();
        this.buildPlayer();
        this.buildGuard();
        this.setupControls();
        this.setupColliders();

        // Interaction state
        this.isNearGuard = false;
        this.isChoosing = false;
    }

    // ─── Background ───────────────────────────────────────────────────────────

    buildBackground() {
        const g = this.add.graphics();

        // Ceiling
        g.fillStyle(0x1a1a2e, 1);
        g.fillRect(0, 0, 800, 80);

        // Wall
        g.fillStyle(0x16213e, 1);
        g.fillRect(0, 80, 800, 420);

        // Floor
        g.fillStyle(0x0f3460, 1);
        g.fillRect(0, 500, 800, 100);

        // Wall detail lines
        g.lineStyle(1, 0x1e2d5a, 1);
        for (let y = 100; y < 500; y += 40) {
            g.lineBetween(0, y, 800, y);
        }
        for (let x = 0; x < 800; x += 80) {
            g.lineBetween(x, 80, x, 500);
        }

        // Door frame on the right
        g.fillStyle(0x0a0a0a, 1);
        g.fillRect(700, 370, 70, 130);
        g.lineStyle(3, 0x888800, 1);
        g.strokeRect(700, 370, 70, 130);

        this.add.text(715, 355, 'EXIT', {
            fontSize: '14px',
            fill: '#888800',
            fontFamily: 'monospace'
        });

        // Sign above guard area
        const sign = this.add.rectangle(640, 360, 160, 30, 0x1a1a1a);
        this.add.text(570, 348, '[ SECURITY CHECKPOINT ]', {
            fontSize: '11px',
            fill: '#ffcc00',
            fontFamily: 'monospace'
        });
    }

    // ─── UI ───────────────────────────────────────────────────────────────────

    buildUI() {
        // Objective
        this.objectiveText = this.add.text(20, 14, `▶ ${this.gameState.objective}`, {
            fontSize: '14px',
            fill: '#aaddff',
            fontFamily: 'monospace'
        });

        // Score
        this.scoreText = this.add.text(20, 34, `SCORE: ${this.gameState.score}`, {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        });

        // Anxiety label
        this.add.text(20, 54, 'ANXIETY:', {
            fontSize: '13px',
            fill: '#ff6666',
            fontFamily: 'monospace'
        });

        // Anxiety bar background
        this.add.rectangle(120, 61, 150, 14, 0x333333).setOrigin(0, 0.5);

        // Anxiety bar fill
        this.anxietyBar = this.add.rectangle(120, 61, 0, 14, 0xff3333).setOrigin(0, 0.5);

        // Anxiety percent text
        this.anxietyLabel = this.add.text(278, 54, '0%', {
            fontSize: '13px',
            fill: '#ff6666',
            fontFamily: 'monospace'
        });

        // Feedback text
        this.feedbackText = this.add.text(20, 78, 'Press H for help', {
            fontSize: '14px',
            fill: '#ffff99',
            fontFamily: 'monospace'
        });

        // Controls hint at bottom
        this.add.text(20, 560, 'WASD / Arrow Keys: Move   W / Up: Jump   E: Interact   H: Help', {
            fontSize: '11px',
            fill: '#555577',
            fontFamily: 'monospace'
        });

        // Choice menu (hidden by default)
        this.choiceBox = this.add.rectangle(400, 300, 380, 160, 0x000000, 0.9).setVisible(false);
        this.choiceText = this.add.text(400, 300, '', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5).setVisible(false);

        // Interact prompt
        this.interactText = this.add.text(400, 400, '', {
            fontSize: '16px',
            fill: '#ffff99',
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
            return p;
        };

        // Ground
        addPlat(400, 536, 800, 32, 0x1a4a6a);

        // Main platforms
        addPlat(600, 420, 200, 20, 0x2a6a4a);
        addPlat(200, 300, 200, 20, 0x2a6a4a);
        addPlat(750, 260, 160, 20, 0x2a6a4a);

        // Small stepping platforms
        addPlat(330, 370, 80, 14, 0x006688);
        addPlat(430, 330, 60, 14, 0x006688);
        addPlat(520, 240, 70, 14, 0x006688);
    }

    // ─── Player ───────────────────────────────────────────────────────────────

    buildPlayer() {
        // Body
        this.player = this.add.rectangle(100, 480, 22, 30, 0xff4455);
        this.physics.add.existing(this.player);
        this.player.body.setBounce(0.1);
        this.player.body.setCollideWorldBounds(true);

        // Direction indicator (small front triangle - updates in update())
        this.playerFace = this.add.triangle(0, 0, 0, -5, 8, 0, 0, 5, 0xffaa44);
    }

    // ─── Guard ────────────────────────────────────────────────────────────────

    buildGuard() {
        // Body
        this.guard = this.add.rectangle(658, 506, 28, 46, 0x667788);

        // Head
        this.add.circle(658, 473, 12, 0xddbb99);

        // Hat
        this.add.rectangle(658, 461, 28, 8, 0x334455);

        // Label
        this.add.text(636, 518, 'GUARD', {
            fontSize: '11px',
            fill: '#aabbcc',
            fontFamily: 'monospace'
        });
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

    // ─── Colliders ────────────────────────────────────────────────────────────

    setupColliders() {
        this.physics.add.collider(this.player, this.platforms);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    update() {
        this.handleMovement();
        this.updatePlayerFace();
        this.handleGuardInteraction();
        this.handleChoices();
        this.updateUI();
    }

    handleMovement() {
        if (this.isChoosing) return; // Freeze player during dialogue

        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.player.body.setVelocityX(-180);
            this.playerDir = 'left';
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.player.body.setVelocityX(180);
            this.playerDir = 'right';
        } else {
            this.player.body.setVelocityX(0);
        }

        if ((this.cursors.up.isDown || this.wasd.W.isDown) && this.player.body.touching.down) {
            this.player.body.setVelocityY(-370);
        }

        // Variable jump height
        if (this.player.body.velocity.y < 0 && !(this.cursors.up.isDown || this.wasd.W.isDown)) {
            this.player.body.setVelocityY(this.player.body.velocity.y * 0.5);
        }
    }

    updatePlayerFace() {
        // Move the direction triangle with the player
        const offset = this.playerDir === 'left' ? -14 : 14;
        this.playerFace.setPosition(this.player.x + offset, this.player.y);
        if (this.playerDir === 'left') {
            this.playerFace.setAngle(180);
        } else {
            this.playerFace.setAngle(0);
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

        // Help key
        if (Phaser.Input.Keyboard.JustDown(this.helpKey)) {
            this.feedbackText.setText('HELP: Walk to the guard and press E. Choose the correct ID!');
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

        // Cooldown before re-interacting
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
            this.checkWinCondition();
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

    checkWinCondition() {
        this.time.delayedCall(1500, () => {
            this.scene.start('WinScene', { score: this.gameState.score, choices: this.gameState.choices });
        });
    }

    checkAnxiety() {
        if (this.gameState.anxiety >= 100) {
            this.time.delayedCall(1000, () => {
                this.scene.start('GameOverScene', { anxiety: this.gameState.anxiety, choices: this.gameState.choices });
            });
        }
    }

    updateUI() {
        this.scoreText.setText(`SCORE: ${this.gameState.score}`);

        // Update anxiety bar width (max 150px wide)
        const barWidth = (this.gameState.anxiety / 100) * 150;
        this.anxietyBar.width = barWidth;

        // Color shifts red as anxiety rises
        if (this.gameState.anxiety < 50) {
            this.anxietyBar.setFillStyle(0xffaa00);
        } else {
            this.anxietyBar.setFillStyle(0xff2222);
        }

        this.anxietyLabel.setText(`${this.gameState.anxiety}%`);
    }
}


// ─── Win Scene ────────────────────────────────────────────────────────────────

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
        this.add.text(400, 310, choiceList, {
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


// ─── Game Over Scene ──────────────────────────────────────────────────────────

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create(data) {
        this.add.rectangle(400, 300, 800, 600, 0x1a0a0a);

        this.add.text(400, 150, '✗ OVERWHELMED', {
            fontSize: '36px',
            fill: '#ff4444',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(400, 220, `Anxiety reached ${data.anxiety}%`, {
            fontSize: '22px',
            fill: '#ffaaaa',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(400, 270, 'Your choices:', {
            fontSize: '18px',
            fill: '#aaaaaa',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        const choiceList = (data.choices || []).join('\n') || 'No choices recorded';
        this.add.text(400, 310, choiceList, {
            fontSize: '16px',
            fill: '#dddddd',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(400, 450, 'Press SPACE to try again', {
            fontSize: '18px',
            fill: '#ffff99',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('MainScene');
        });
    }
}