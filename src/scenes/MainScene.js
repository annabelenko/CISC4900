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
        console.log('MainScene create called - setting up game objects');
        
        // Add a welcome text
        this.add.text(400, 100, 'Welcome to Phaser - Use WASD or Arrow Keys!', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

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

        // Instructions
        this.add.text(50, 50, 'Arrow keys/WASD: Move | Up/W: Jump', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        this.add.text(50, 70, 'Red square = Player | Green = Platforms | Blue = Small platforms', {
            fontSize: '14px',
            fill: '#00ccff',
            fontFamily: 'Arial'
        });
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
    }
}