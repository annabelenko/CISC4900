# CISC 4900 — Beyond Barriers

A 2D educational platformer built with [Phaser 3](https://phaser.io/) about disability and accessibility on a college campus. Players navigate two scenes — a security checkpoint and a classroom — collecting quiz tokens that trigger AI-generated accessibility questions powered by a RAG pipeline backed by Google Gemini. Features tunnel vision simulation, text-to-speech narration, a selectable HTML UI, pixel-art sprites, and an anxiety meter.

## Demo

<img width="800" height="508" alt="ezgif-6f4cbf6d1318d13a" src="https://github.com/user-attachments/assets/c28384d7-f7b7-4b16-ae96-6a705ab6417c" />

## 📋 Prerequisites

- **Node.js** (version 14 or higher) — [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Python 3.9+** — [Download here](https://www.python.org/)
- A **Google AI API key** — [Get one here](https://ai.google.dev/)
- An **ElevenLabs API key** — [Get one here](https://elevenlabs.io/)
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
Edit `backend/.env` and add your API keys:
```
GOOGLE_API_KEY=your-google-api-key-here
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
```

### 5. Ingest Documents (RAG pipeline)
```bash
cd backend
python3 ingest.py
```
This processes research PDFs with docling OCR, splits them into chunks, embeds them with `all-MiniLM-L6-v2`, and stores them in a local ChromaDB vector store.

### 6. Start the Backend Server
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8080
```

### 7. Start the Frontend (in a separate terminal)
```bash
npm start
```
Opens `http://localhost:8000` in your default browser.

> **Note:** The game works without the backend — questions and narration fall back gracefully if the API is unavailable.

## 🎮 How to Play

### Level 1 — Security Checkpoint
1. Collect **5 yellow ? tokens** scattered across platforms — each triggers an AI quiz question.
2. Answer correctly for **+50 points**. Wrong answers raise your **anxiety meter**.
3. Once all 5 questions are answered, find the **security guard** and press **E**.
4. Show the correct ID (Student ID) to advance to the next level.

### Level 2 — Classroom
1. Collect **3 cyan ? tokens** to answer accessibility quiz questions.
2. After all 3 are answered, approach the **professor** and press **E** to complete the level.

### General Rules
- Closing a question with **✕** without answering returns the token to a random platform after 5 seconds.
- If anxiety reaches **100%**, it's game over!

### Controls

| Input | Action |
|-------|--------|
| **← / → Arrow Keys** or **A / D** | Move left / right |
| **↑ Arrow** or **W** | Jump |
| **E** | Interact with NPC |
| **H** | Show help hint |
| **1 / 2 / 3 / 4** | Select a quiz answer |
| **ESC** or **MENU** button | Pause menu |

## 📁 Project Structure

```
CISC4900/
├── index.html                  # Entry point — loads Phaser, overlay HTML panels
├── package.json                # Project config & dependencies
├── README.md                   # This file
├── css/
│   └── style.css               # Dark theme, HTML overlay panels (stats, quest, questions)
├── assets/
│   ├── anna.png / anna.json    # Anna character spritesheet & atlas
│   ├── lu.png / lu.json        # Lu character spritesheet & atlas
│   ├── guard.png / guard.json  # Guard NPC spritesheet & atlas
│   ├── scene1.png              # Level 1 background
│   └── ledge.png               # Platform tile
├── src/
│   ├── main.js                 # Phaser game config & scene list
│   └── scenes/
│       ├── TitleScene.js       # Title screen with character select (Anna / Lu)
│       ├── MainScene.js        # Level 1 — security checkpoint
│       ├── ClassroomScene.js   # Level 2 — classroom & professor
│       ├── WinScene.js         # Victory screen
│       └── GameOverScene.js    # Game-over screen
└── backend/
    ├── main.py                 # FastAPI server — RAG question API + TTS API
    ├── ingest.py               # Document ingestion script (OCR → embed → ChromaDB)
    ├── requirements.txt        # Python dependencies
    ├── .env.example            # Environment variable template
    └── .env                    # Your API keys (not committed)
```

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Game engine | Phaser 3.70 (via CDN) |
| Backend framework | FastAPI (Python) |
| AI model | Google Gemini 2.5 Flash Lite |
| RAG — document OCR | docling |
| RAG — text splitting | LangChain `RecursiveCharacterTextSplitter` |
| RAG — embeddings | HuggingFace `all-MiniLM-L6-v2` |
| RAG — vector store | ChromaDB (local) |
| Text-to-speech | ElevenLabs API (voice: Rachel) |
| Physics | Phaser Arcade Physics |
| Static file server | http-server (dev) |

## 🧠 RAG Pipeline

Quiz questions are grounded in real accessibility research documents using a Retrieval-Augmented Generation (RAG) pipeline:

1. **Ingestion (`ingest.py`)** — Research PDFs are OCR-processed with docling and split into overlapping text chunks with `RecursiveCharacterTextSplitter`.
2. **Embedding** — Each chunk is embedded using HuggingFace's `all-MiniLM-L6-v2` sentence transformer.
3. **Storage** — Embeddings are persisted in a local ChromaDB vector store (`backend/chroma_db/`).
4. **Retrieval** — At question time, the backend retrieves the most relevant chunks via cosine similarity search.
5. **Generation** — Retrieved context is injected into a prompt sent to Google Gemini 2.5 Flash Lite, which generates a 4-option multiple-choice question with an explanation.

The `/api/question` endpoint returns `{ question, options[], correct_index, explanation }`.

## 🔊 Text-to-Speech Narration

Scene narration is generated at runtime via the ElevenLabs API (`/api/tts` endpoint). Each scene plays an opening narration and a completion message when all tokens are answered. The voice is Rachel (`eleven_turbo_v2_5` model) for low latency.

## 🖼️ Sprite Specifications

- **Format**: PNG with transparent background
- **Frame size**: 16 × 32 pixels, scaled 2.5× in-game (→ 40 × 80 px on screen)
- **Layout**: Horizontal spritesheet
- **Atlas format**: Aseprite JSON (frame names map to pixel regions)
- **Filter**: `NEAREST` (pixel-perfect, no smoothing)

## ✅ What's Been Built

### Gameplay
- Two playable scenes: security checkpoint (Level 1) and classroom (Level 2)
- 5 quiz tokens in Level 1, 3 in Level 2; NPC gate only opens after all tokens are answered
- Token restore: closing a question without answering respawns the token at a random platform position after 5 seconds
- Anxiety meter — wrong answers raise it; game over at 100%
- ID choice mini-game at the security guard (Level 1)
- Pause menu (ESC / MENU button) with Continue and End Game options

### AI & RAG
- RAG pipeline grounding questions in real accessibility research (docling OCR → LangChain splitter → HuggingFace embeddings → ChromaDB → Gemini prompt injection)
- Question pre-fetching: next question loads silently in the background so there's no wait after collecting a token
- Fetch cancellation: if the player closes the question overlay mid-fetch, the stale result is discarded

### Accessibility & UX
- **Tunnel vision effect** using a GeometryMask (inverted alpha) on a full-screen dark overlay — simulates a disability experience
- **Selectable text**: all UI panels (stats, quest bar, questions, answer options) are real HTML DOM elements so text can be highlighted and copied
- **TTS narration** plays at scene start and on completion
- Stats HUD (objective, score, anxiety bar) and quest bar always visible above tunnel vision overlay
- Pixel-art sprites (Anna, Lu, Guard) with NEAREST filter and walk/idle/jump animations

### Polish
- `scene1.png` background for Level 1; `ledge.png` platform tiles
- Guard NPC replaced with animated sprite (2-frame idle, same scale as player)
- Character select on title screen (Anna or Lu) carries through all scenes

## 🐛 Troubleshooting

### Game Won't Start
1. **Check Console**: Press F12 → Console tab for errors
2. **Verify Assets**: Confirm `anna.png`, `anna.json`, `lu.png`, `lu.json`, `guard.png`, `guard.json`, `scene1.png`, `ledge.png` all exist in `assets/`
3. **Clear Cache**: Hard refresh with `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### No Questions Appearing
1. Confirm the backend is running on port 8080
2. Check that `backend/chroma_db/` exists — if not, run `python3 ingest.py` first
3. Verify `GOOGLE_API_KEY` is set in `backend/.env`

### No Voice Narration
1. Confirm `ELEVENLABS_API_KEY` is set in `backend/.env`
2. Check the browser console for TTS fetch errors
3. Narration requires a user gesture first (click the game area)

### Controls Not Working
1. **Click Game Area**: The browser requires a user gesture before accepting keyboard input
2. **Check Focus**: Make sure the game canvas has focus

## 🚧 Next Steps

- **Progressive difficulty** — Increase question difficulty per level by passing the level number into the Gemini prompt.
- **More scenes** — Add a library, cafeteria, or dorm environment with unique layouts and NPCs.
- **Expanded anxiety system** — Tie anxiety to difficulty: wrong answers trigger harder follow-up questions.
- **Persistent scoring & leaderboard** — Save scores to the backend so progress persists across sessions.
- **Additional characters** — More playable characters with unique spritesheets and animations.
- **Sound effects & music** — Audio feedback for interactions and ambient background music.
- **Mobile / touch controls** — On-screen buttons for phone and tablet support.


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

- **Token completion gating** — Require all tokens on a level to be collected and answered correctly before the exit unlocks and the player can advance to the next level.
- **Progressive difficulty** — Increase question difficulty per level by passing the current level number to the AI prompt, so later levels have harder and more specific questions.
- **More scenes & levels** — Add new environments (library, cafeteria, dorm) each with unique layouts, platforms, and NPCs presenting different accessibility scenarios.
- **Expanded anxiety system** — Tie anxiety to difficulty scaling — wrong answers trigger harder follow-up questions and reduce time allowed.
- **Persistent scoring & leaderboard** — Save player scores to a backend so progress carries across sessions.
- **Additional characters & animations** — Add more playable characters with unique spritesheets.
- **Sound effects & music** — Add audio feedback for interactions and ambient background music.
- **Mobile / touch controls** — Add on-screen buttons for phone and tablet support.
