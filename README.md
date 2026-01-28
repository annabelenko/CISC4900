# Phaser Game Project

A basic Phaser.js game project with a simple platformer example.

## Project Structure

```
├── index.html          # Main HTML file
├── package.json        # Project dependencies
├── src/
│   ├── main.js         # Main game configuration
│   └── scenes/
│       └── MainScene.js # Main game scene
├── css/
│   └── style.css       # Game styling
└── assets/
    ├── images/         # Image assets
    └── audio/          # Audio assets
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:8000`

## Controls

- **Arrow Keys** or **WASD**: Move the player
- **Up Arrow** or **W**: Jump

## Features

- Basic platformer physics
- Player movement and jumping
- Simple collision detection
- Responsive game container

## Adding Assets

Place your game assets in the appropriate folders:
- Images: `assets/images/`
- Audio: `assets/audio/`

Update the `preload()` method in `MainScene.js` to load your assets.

## Next Steps

- Add sprites and animations
- Implement game mechanics
- Add sound effects and music
- Create additional scenes (menu, game over, etc.)
- Add collectibles and enemies