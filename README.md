# CISC 4900 — Identity Checkpoint

A 2D platformer game built with [Phaser 3](https://phaser.io/) where the player navigates a security checkpoint, interacts with a guard, and must present the correct ID to pass. Features character switching, an anxiety meter, branching choices, and pixel-art sprites.

## 📋 Prerequisites

- **Node.js** (version 14 or higher) — [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- A modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/annabelenko/CISC4900
cd CISC4900
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
This starts an HTTP server on **port 8000** and opens `http://localhost:8000` in your default browser.

To start the server without auto-opening the browser:
```bash
npm start
```

## 🎮 How to Play

1. Move your character to the **security guard** near the exit door.
2. Press **E** to interact — a choice menu appears.
3. Choose the correct ID (Student ID) to pass through. Wrong answers raise your **anxiety meter**.
4. If anxiety reaches **100%**, it's game over. Pick the right ID to win!

### Controls

| Input | Action |
|-------|--------|
| **← / → Arrow Keys** or **A / D** | Move left / right |
| **↑ Arrow Key** or **W** | Jump |
| **E** | Interact with the guard |
| **H** | Show help hint |
| **1 / 2 / 3** | Select a choice during interaction |
| **Blue "Anna" button** | Switch to Anna character |
| **Red "Lu" button** | Switch to Lu character |

## 📁 Project Structure

```
CISC4900/
├── index.html                  # Entry point — loads Phaser via CDN and game scripts
├── package.json                # Project config & dependencies
├── README.md                   # This file
├── css/
│   └── style.css               # Game container styling (dark theme)
├── assets/
│   ├── anna.png                # Anna character spritesheet
│   ├── anna.json               # Anna atlas / animation frame data
│   ├── lu.png                  # Lu character spritesheet
│   └── lu.json                 # Lu atlas / animation frame data
└── src/
    ├── main.js                 # Phaser game config & initialization
    └── scenes/
        ├── MainScene.js        # Core gameplay — platforms, player, guard, choices
        ├── WinScene.js         # Victory screen (correct ID chosen)
        └── GameOverScene.js    # Game-over screen (anxiety maxed out)
```

## 🔧 Tech Stack

- **Phaser 3.70** — HTML5 game framework (loaded via CDN)
- **http-server** — zero-config static file server (dev dependency)
- **Arcade Physics** — gravity and collision handling
- **Texture Atlas** — sprite animations defined in JSON

## 🖼️ Sprite Requirements

- **Format**: PNG with transparent background
- **Frame size**: 16 × 32 pixels (scaled 2.5× in-game)
- **Layout**: Horizontal spritesheet
- **Frames**:
  - 0–11: Walk cycle (12 frames)
  - 5: Idle pose
  - 6–8: Jump animation

Companion JSON files use the Aseprite atlas format to map frame names to pixel regions.

## 🐛 Troubleshooting

### Game Won't Start
1. **Check Console**: Press F12 and look for errors in Console tab
2. **Verify Assets**: Make sure `anna.png`, `anna.json`, `lu.png`, and `lu.json` exist in `assets/` folder
3. **Clear Cache**: Hard refresh with Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

### Controls Not Working
1. **Click Game Area**: Browser requires user interaction before accepting keyboard input
2. **Check Focus**: Make sure the game window has focus (click anywhere on it)
3. **Try Different Keys**: Test both arrow keys and WASD

### Character Animation Issues
1. **Check Frame Names**: Ensure JSON frame names match the `generateFrameNames` parameters
2. **Verify Frame Count**: Make sure animation ranges don't exceed available frames
3. **Console Errors**: Look for "Animation key not found" errors

## 🔧 Configuration

### Game Settings
Key settings in `index.html`:
```javascript
const gameConfig = {
    width: 800,           // Game canvas width
    height: 600,          // Game canvas height
    backgroundColor: '#2c3e50',  // Background color
    render: {
        antialias: false, // Disable smoothing for pixel art
        pixelArt: true   // Enable pixel-perfect rendering
    }
};
```

### Physics Settings
```javascript
physics: {
    arcade: {
        gravity: { y: 300 },    // Gravity strength
        debug: false           // Show collision boxes (set to true for debugging)
    }
}
```

## 📝 Customization

### Modify Platforms
Edit the platform creation code in the `create()` function:
```javascript
// Add new platform
const newPlatform = this.add.rectangle(x, y, width, height, color);
this.physics.add.existing(newPlatform, true);
this.platforms.add(newPlatform);
```

### Adjust Player Physics
```javascript
// Movement speed
this.player.body.setVelocityX(180);  // Change 180 to desired speed

// Jump strength  
this.player.body.setVelocityY(-350); // Change -350 to desired jump height

// Player size
this.player.setScale(4);             // Change 4 to desired scale
```

## 🚧 Next Steps

- **LangChain-powered question generator** — Replace the hardcoded choice menu with dynamically generated questions using [LangChain.js](https://js.langchain.com/). An LLM-backed chain would produce contextual prompts (e.g., "The guard asks for identification — what do you show?") with varied answer options each playthrough, making the game replayable and unpredictable.
- **Multiple levels / checkpoints** — Expand beyond the single security-checkpoint level with new scenes, obstacles, and NPCs that each present their own LangChain-generated scenarios.
- **Persistent scoring & leaderboard** — Save player scores and choices to a backend (e.g., Firebase or a simple Express API) so progress carries across sessions.
- **Expanded anxiety system** — Tie anxiety changes to LLM-generated difficulty scaling — wrong answers could trigger follow-up questions that get progressively harder.
- **Additional characters & animations** — Add more playable characters with unique spritesheets and animations.
- **Sound effects & music** — Add audio feedback for interactions, correct/wrong answers, and ambient background music.
- **Mobile / touch controls** — Add on-screen buttons so the game is playable on phones and tablets.