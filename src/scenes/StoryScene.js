class StoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StoryScene' });
    }

    create(data) {
        this.characterData = data;
        // Dark background
        this.add.rectangle(400, 300, 800, 600, 0x000000, 1);

        this.fullText = [
            "Congratulations! Your hard work has paid off, and you are officially",
            "a Computer Science student at one of the country's most prestigious universities.",
            "",
            "You were born with peripheral vision loss, meaning the world reaches you",
            "through a narrow window. You've mastered the art of focus, but today,",
            "the bustling campus feels like a labyrinth.",
            "",
            "Your Mission:",
            "  > 1. Navigate through the crowded courtyard to the Computer Science lecture hall.",
            "    2. Locate your professor before the first lecture begins.",
            "    3. Hand over your accommodation letter to ensure you have the tools",
            "       you need to succeed this semester.",
            "",
            "The hallways are narrow, the shadows are long, and the clock is ticking.",
            "Your education is a right, but today, simply getting to your desk is",
            "the first challenge.",
            "",
            "Stay centered. Good luck."
        ].join('\n');

        this.charIndex = 0;
        this.displayText = '';
        this.typingDone = false;

        this.storyText = this.add.text(60, 50, '', {
            fontSize: '14px',
            fill: '#e8e8e8',
            fontFamily: 'monospace',
            lineSpacing: 6
        });

        this.skipText = this.add.text(400, 555, 'PRESS  SPACE  TO  SKIP', {
            fontSize: '12px',
            fill: '#aaaaaa',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.continueText = this.add.text(400, 555, 'PRESS  SPACE  TO  CONTINUE', {
            fontSize: '13px',
            fill: '#ffff99',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setAlpha(0);

        // Typewriter timer — one character every 28ms
        this.typingTimer = this.time.addEvent({
            delay: 28,
            callback: this.typeNextChar,
            callbackScope: this,
            loop: true
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.typingDone) {
                // Skip to full text immediately
                this.typingTimer.remove();
                this.storyText.setText(this.fullText);
                this.typingDone = true;
                this.skipText.setAlpha(0);
                this.showContinuePrompt();
            } else {
                this.scene.start('MainScene', this.characterData);
            }
        });
    }

    typeNextChar() {
        if (this.charIndex < this.fullText.length) {
            this.displayText += this.fullText[this.charIndex];
            this.storyText.setText(this.displayText);
            this.charIndex++;
        } else {
            this.typingTimer.remove();
            this.typingDone = true;
            this.skipText.setAlpha(0);
            this.showContinuePrompt();
        }
    }

    showContinuePrompt() {
        this.tweens.add({
            targets: this.continueText,
            alpha: 1,
            duration: 400
        });
        this.tweens.add({
            targets: this.continueText,
            alpha: 0,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Linear',
            delay: 400
        });
    }
}
