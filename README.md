# Phaser.js Platformer Game

A 2D platformer game built with Phaser.js featuring character switching, pixel art sprites, and smooth animations.

## Demo

![Game Demo](CISC4900/demo.gif)

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A code editor (VS Code recommended)

## 🚀 Getting Started

### 1. Clone or Download the Project
```bash
git clone https://github.com/annabelenko/CISC4900
cd CISC4900
```

### 2. Install Dependencies
```bash
npm install
```
This installs:
- `phaser` - The game framework
- `http-server` - Local development server

### 3. Start the Development Server
```bash
npm run dev
```
This will:
- Start a local server on port 8000
- Automatically open your browser
- Enable live reloading

### 4. Open in Browser
Navigate to: `http://localhost:8000`

If it doesn't open automatically, you can also run:
```bash
npm start
```
(This starts the server without auto-opening the browser)

## 📁 Project Structure

```
CISC4900/
├── index.html              # Main HTML file with embedded game code
├── package.json            # Project configuration and dependencies
├── package-lock.json       # Dependency lock file
├── README.md              # This file
├── css/
│   └── style.css          # Game container styling
├── assets/
│   ├── anna.png           # Anna character spritesheet
│   ├── anna.json          # Anna animation frame data
│   ├── lu.png             # Lu character spritesheet
│   └── lu.json            # Lu animation frame data
└── node_modules/          # Installed dependencies (auto-generated)
```

## 🎮 Controls

| Input | Action |
|-------|--------|
| **←/→ Arrow Keys** or **A/D** | Move left/right |
| **↑ Arrow Key**, **W**, or **Spacebar** | Jump |
| **Mouse Click** | Focus game (required for keyboard input) |
| **Blue "Anna" Button** | Switch to Anna character |
| **Red "Lu" Button** | Switch to Lu character |

### Sprite Requirements

- **Format**: PNG with transparent background
- **Size**: 16x32 pixels per frame (automatically scaled 4x in game)
- **Layout**: Horizontal spritesheet with frames side by side
- **Frames**: 
  - Frame 0-11: Walking animation (12 frames)
  - Frame 5: Idle pose
  - Frame 6-8: Jumping animation

### JSON Frame Data

The JSON files define frame positions and names. Example structure:
```json
{
  "frames": {
    "Sprite-0001 0.": { "frame": { "x": 0, "y": 0, "w": 16, "h": 32 } },
    "Sprite-0001 1.": { "frame": { "x": 16, "y": 0, "w": 16, "h": 32 } }
  }
}
```

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