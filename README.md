# CISC 4900 — Beyond Barriers

A 2D platformer game built with [Phaser 3](https://phaser.io/) where the player navigates platforms, collects tokens that trigger AI-generated quiz questions, and must reach the security guard to present the correct ID. Features character switching, an anxiety meter, LangChain-powered questions via Google Gemini, and pixel-art sprites.

## 📋 Prerequisites

- **Node.js** (version 14 or higher) — [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Python 3.9+** — [Download here](https://www.python.org/)
- A **Google AI API key** — [Get one here](https://ai.google.dev/)
- A modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/annabelenko/CISC4900
cd CISC4900
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Set Up the Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
cp .env.example .env
```
Edit `backend/.env` and add your API key:
```
GOOGLE_API_KEY=your-google-api-key-here
```

### 5. Start the Backend Server
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8080
```

### 6. Start the Frontend (in a separate terminal)
```bash
npm run dev
```
This starts an HTTP server on **port 8000** and opens `http://localhost:8000` in your default browser.

> **Note:** The game works without the backend — it falls back to built-in questions if the API is unavailable.

## 🎮 How to Play

1. You start on the **top platform**. Jump down to explore.
2. Collect **yellow ? tokens** on platforms — each triggers an AI-generated quiz question.
3. Answer correctly for **+50 points**. Wrong answers raise your **anxiety meter** by 15%.
4. Reach the **security guard** near the exit and press **E** to interact.
5. Show the correct ID (Student ID) to win. Wrong answers raise anxiety further.
6. If anxiety reaches **100%**, it's game over!

### Controls

| Input | Action |
|-------|--------|
| **← / → Arrow Keys** or **A / D** | Move left / right |
| **↑ Arrow Key** or **W** | Jump |
| **E** | Interact with the guard |
| **H** | Show help hint |
| **1 / 2 / 3 / 4** | Select a choice |
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
│   ├── anna.png / anna.json    # Anna character spritesheet & atlas
│   └── lu.png / lu.json        # Lu character spritesheet & atlas
├── src/
│   ├── main.js                 # Phaser game config & initialization
│   └── scenes/
│       ├── TitleScene.js       # Title screen with character select
│       ├── MainScene.js        # Core gameplay — platforms, tokens, questions, guard
│       ├── ClassroomScene.js   # Classroom scene
│       ├── WinScene.js         # Victory screen
│       └── GameOverScene.js    # Game-over screen
└── backend/
    ├── main.py                 # FastAPI server — LangChain + Gemini question API
    ├── requirements.txt        # Python dependencies
    ├── .env.example            # Environment variable template
    └── .env                    # Your API keys (not committed)
```

## 🔧 Tech Stack

- **Phaser 3.70** — HTML5 game framework (loaded via CDN)
- **FastAPI** — Python backend for the question API
- **LangChain + Google Gemini 2.5 Flash** — AI-generated quiz questions
- **LangSmith** — LLM observability and tracing
- **http-server** — zero-config static file server (dev dependency)
- **Arcade Physics** — gravity and collision handling

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

- **Multiple levels / checkpoints** — Expand beyond the single security-checkpoint level with new scenes, obstacles, and NPCs.
- **Persistent scoring & leaderboard** — Save player scores to a backend so progress carries across sessions.
- **Expanded anxiety system** — Tie anxiety to difficulty scaling — wrong answers trigger harder follow-up questions.
- **Additional characters & animations** — Add more playable characters with unique spritesheets.
- **Sound effects & music** — Add audio feedback for interactions and ambient background music.
- **Mobile / touch controls** — Add on-screen buttons for phone and tablet support.