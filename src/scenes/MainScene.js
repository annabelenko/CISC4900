class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // Create simple colored rectangles for testing
        this.load.image('ground', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }

    create() {
        // Add a welcome text
        this.add.text(400, 100, 'Welcome to Phaser!', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Create platforms
        this.platforms = this.physics.add.staticGroup();
        
        // Ground platform
        this.platforms.create(400, 568, 'ground').setScale(800, 64).refreshBody().setTint(0x00ff00);
        
        // Large floating platforms
        this.platforms.create(600, 400, 'ground').setScale(200, 32).refreshBody().setTint(0x00ff00);
        this.platforms.create(50, 250, 'ground').setScale(200, 32).refreshBody().setTint(0x00ff00);
        this.platforms.create(750, 220, 'ground').setScale(200, 32).refreshBody().setTint(0x00ff00);
        
        // Small platforms for vertical movement
        this.platforms.create(300, 350, 'ground').setScale(80, 20).refreshBody().setTint(0x00ccff);
        this.platforms.create(400, 300, 'ground').setScale(60, 20).refreshBody().setTint(0x00ccff);
        this.platforms.create(500, 250, 'ground').setScale(70, 20).refreshBody().setTint(0x00ccff);
        this.platforms.create(350, 180, 'ground').setScale(80, 20).refreshBody().setTint(0x00ccff);
        this.platforms.create(450, 130, 'ground').setScale(60, 20).refreshBody().setTint(0x00ccff);

        // Create player
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setDisplaySize(24, 32);
        this.player.setTint(0xff4444);
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        // Player physics
        this.physics.add.collider(this.player, this.platforms);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');

        // Instructions
        this.add.text(50, 50, 'Arrow keys/WASD: Move | Up/W: Jump', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        this.add.text(50, 70, 'Blue platforms: Small stepping stones', {
            fontSize: '14px',
            fill: '#00ccff',
            fontFamily: 'Arial'
        });
    }

    update() {
        // Player movement
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.player.setVelocityX(-180);
        }
        else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.player.setVelocityX(180);
        }
        else {
            this.player.setVelocityX(0);
        }

        // Jumping - improved for better platform navigation
        if ((this.cursors.up.isDown || this.wasd.W.isDown) && this.player.body.touching.down) {
            this.player.setVelocityY(-350);
        }
        
        // Variable jump height - release key for shorter jump
        if (this.player.body.velocity.y < 0 && !(this.cursors.up.isDown || this.wasd.W.isDown)) {
            this.player.setVelocityY(this.player.body.velocity.y * 0.5);
        }
    }
}