class StoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StoryScene' });
    }

    create(data) {
        this.characterData = data;
        // Dark background
        this.add.rectangle(400, 300, 800, 600, 0x000000, 1);

        this.fullText = [
            "You are a Computer Science student with peripheral vision loss.",
            "The campus feels like a labyrinth today.",
            "",
            "Your Mission:",
            "  > Navigate to the lecture hall.",
            "    Find your professor.",
            "    Deliver your accommodation letter.",
            "",
            "Stay centered. Good luck."
        ].join('\n');

        this.charIndex = 0;
        this.displayText = '';
        this.typingDone = false;
        this.audio = null;
        this.audioBlob = null;

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

        // Typewriter timer — starts paused, speed set once audio duration is known
        this.typingTimer = this.time.addEvent({
            delay: 60,
            callback: this.typeNextChar,
            callbackScope: this,
            loop: true,
            paused: true
        });

        // Fetch and play TTS audio — will sync typing speed to audio
        this.prefetchSpeech(this.fullText);

        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.typingDone) {
                // Skip to full text immediately
                this.typingTimer.remove();
                if (this.audio) {
                    this.audio.pause();
                    this.audio = null;
                }
                this.storyText.setText(this.fullText);
                this.typingDone = true;
                this.skipText.setAlpha(0);
                this.showContinuePrompt();
            } else {
                if (this.audio) {
                    this.audio.pause();
                    this.audio = null;
                }
                this.scene.start('MainScene', this.characterData);
            }
        });
    }

    playAudio(blob) {
        if (this.typingDone) return; // user already skipped, don't play
        const url = URL.createObjectURL(blob);
        this.audio = new Audio(url);

        // Fallback: if audio metadata doesn't load within 3s, start typing anyway
        const fallbackTimer = setTimeout(() => {
            if (!this.typingDone && this.typingTimer.paused) {
                this.typingTimer.paused = false;
            }
        }, 3000);

        this.audio.addEventListener('loadedmetadata', () => {
            clearTimeout(fallbackTimer);
            const duration = this.audio.duration; // in seconds
            const msPerChar = (duration * 1000 * 0.765) / this.fullText.length;
            this.typingTimer.delay = Math.max(30, msPerChar);
            this.typingTimer.paused = false;
            this.audio.play().catch(e => console.warn('Audio play failed:', e));
        });

        this.audio.addEventListener('error', () => {
            clearTimeout(fallbackTimer);
            if (!this.typingDone && this.typingTimer.paused) {
                this.typingTimer.paused = false;
            }
        });
    }

    async prefetchSpeech(text) {
        try {
            const res = await fetch('http://localhost:8080/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (!res.ok) {
                this.typingTimer.paused = false;
                return;
            }
            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('audio')) {
                this.typingTimer.paused = false;
                return;
            }
            const blob = await res.blob();
            this.audioBlob = blob;
            this.playAudio(blob);
        } catch (e) {
            console.warn('TTS unavailable:', e);
            this.typingTimer.paused = false;
        }
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
