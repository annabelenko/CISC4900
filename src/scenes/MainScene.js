class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        console.log('MainScene constructor called');
    }

    preload() {
        console.log('MainScene preload called');
        // No need to preload anything - we'll use built-in shapes
    }

    create() {
        this.gameState = {
            level: 1,
            objective: 'Show the correct ID',
            score: 0,
            anxiety: 0
        };

        console.log("NEW VERSION");

        console.log('MainScene create called - setting up game objects');
        
        // Add a welcome text
        this.add.text(400, 130, 'Welcome to Phaser - Use WASD or Arrow Keys!', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Objective text
        this.objectiveText = this.add.text(20, 20, `Objective: ${this.gameState.objective}`, {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });

        // Score / anxiety display
        this.statusText = this.add.text(20, 50, `Score: ${this.gameState.score} | Anxiety: ${this.gameState.anxiety}`, {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });

        // Feedback / help text
        this.feedbackText = this.add.text(20, 80, 'Press H for help', {
            fontSize: '18px',
            fill: '#ffff99',
            fontFamily: 'Arial'
        });

        // Create platforms using built-in rectangles
        this.platforms = this.physics.add.staticGroup();
        
        // Ground platform - create a filled rectangle
        const ground = this.add.rectangle(400, 568, 800, 64, 0x00ff00);
        this.physics.add.existing(ground, true); // true = static body
        this.platforms.add(ground);
        
        // Large floating platforms
        const platform1 = this.add.rectangle(600, 400, 200, 32, 0x00aa00);
        this.physics.add.existing(platform1, true);
        this.platforms.add(platform1);
        
        const platform2 = this.add.rectangle(200, 250, 200, 32, 0x00aa00);
        this.physics.add.existing(platform2, true);
        this.platforms.add(platform2);
        
        const platform3 = this.add.rectangle(750, 220, 200, 32, 0x00aa00);
        this.physics.add.existing(platform3, true);
        this.platforms.add(platform3);
        
        // Small platforms for vertical movement
        const smallPlat1 = this.add.rectangle(300, 350, 80, 20, 0x00ccff);
        this.physics.add.existing(smallPlat1, true);
        this.platforms.add(smallPlat1);
        
        const smallPlat2 = this.add.rectangle(400, 300, 60, 20, 0x00ccff);
        this.physics.add.existing(smallPlat2, true);
        this.platforms.add(smallPlat2);
        
        const smallPlat3 = this.add.rectangle(500, 180, 70, 20, 0x00ccff);
        this.physics.add.existing(smallPlat3, true);
        this.platforms.add(smallPlat3);

        // Create player using built-in rectangle
        this.player = this.add.rectangle(100, 450, 24, 32, 0xff4444);
        this.physics.add.existing(this.player);
        this.player.body.setBounce(0.2);
        this.player.body.setCollideWorldBounds(true);

        // Player physics
        this.physics.add.collider(this.player, this.platforms);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');

        console.log('MainScene create completed - game should be visible now');

        // Help key
        this.helpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);

        // Instructions
        this.add.text(20, 110, 'Arrow keys/WASD: Move | Up/W: Jump', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        this.add.text(20, 135, 'Red square = Player | Green = Platforms | Blue = Small platforms', {
            fontSize: '14px',
            fill: '#00ccff',
            fontFamily: 'Arial'
        });

        // Security guard placeholder
        this.guard = this.add.rectangle(650, 500, 30, 50, 0x888888);
        this.guardLabel = this.add.text(620, 460, 'Security', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });

        // Interaction / choice state
        this.isNearGuard = false;
        this.isChoosing = false;

        // Interaction prompt
        this.interactText = this.add.text(560, 430, '', {
            fontSize: '18px',
            fill: '#ffff99',
            fontFamily: 'Arial'
        });

        // Choice text
        this.choiceText = this.add.text(500, 120, '', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#000000',
            padding: { x: 10, y: 10 }
        });

        // Interaction key
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // Number keys for choices
        this.oneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.twoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.threeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    }

    update() {
        // Player movement
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.player.body.setVelocityX(-180);
        }
        else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.player.body.setVelocityX(180);
        }
        else {
            this.player.body.setVelocityX(0);
        }

        // Jumping - improved for better platform navigation
        if ((this.cursors.up.isDown || this.wasd.W.isDown) && this.player.body.touching.down) {
            this.player.body.setVelocityY(-350);
        }
        
        // Variable jump height - release key for shorter jump
        if (this.player.body.velocity.y < 0 && !(this.cursors.up.isDown || this.wasd.W.isDown)) {
            this.player.body.setVelocityY(this.player.body.velocity.y * 0.5);
        }

                // Check if player is near the guard
        const distance = Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            this.guard.x,
            this.guard.y
        );

        if (distance < 80 && !this.isChoosing) {
            this.isNearGuard = true;
            this.interactText.setText('Press E to interact');
        } else if (!this.isChoosing) {
            this.isNearGuard = false;
            this.interactText.setText('');
        }

        // Open choice menu
        if (this.isNearGuard && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            this.isChoosing = true;
            this.choiceText.setText(
                'Choose what to show:\n' +
                '1 = Student ID\n' +
                '2 = Credit Card\n' +
                '3 = Library Card'
            );
            this.feedbackText.setText('Make your choice.');
        }

        // Handle choices
        if (this.isChoosing) {
            if (Phaser.Input.Keyboard.JustDown(this.oneKey)) {
                this.gameState.score += 100;
                this.feedbackText.setText('Correct! Security lets you in.');
                this.choiceText.setText('');
                this.isChoosing = false;
            }

            if (Phaser.Input.Keyboard.JustDown(this.twoKey)) {
                this.gameState.anxiety += 25;
                this.feedbackText.setText('Wrong choice. A credit card is not valid ID.');
                this.choiceText.setText('');
                this.isChoosing = false;
            }

            if (Phaser.Input.Keyboard.JustDown(this.threeKey)) {
                this.gameState.anxiety += 10;
                this.feedbackText.setText('Not quite. A library card is not the correct ID here.');
                this.choiceText.setText('');
                this.isChoosing = false;
            }

            
        }
        // Update score/anxiety text
        this.statusText.setText(`Score: ${this.gameState.score} | Anxiety: ${this.gameState.anxiety}%   `);

        // Help system
        if (Phaser.Input.Keyboard.JustDown(this.helpKey)) {
            this.feedbackText.setText('Help: You need to choose the correct ID to enter.');
        }
    }
}