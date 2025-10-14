# 3D Block Stack Game

[![Code Quality Check](https://github.com/harshit-sharma2005/3D-Blockstack/actions/workflows/lint.yml/badge.svg)](https://github.com/harshit-sharma2005/3D-Blockstack/actions/workflows/lint.yml)
[![Vercel Preview](https://github.com/harshit-sharma2005/3D-Blockstack/actions/workflows/vercel-preview.yml/badge.svg)](https://github.com/harshit-sharma2005/3D-Blockstack/actions/workflows/vercel-preview.yml)

A engaging 3D block stacking game inspired by classic stacking mechanics, built with Three.js for rendering and Cannon.js for realistic physics simulations. Test your precision and timing to build the tallest tower possible!

## 🎮 Game Features

- **Immersive 3D Graphics**: Powered by Three.js for high-performance, interactive 3D visuals with lighting, shadows, and camera controls.
- **Realistic Physics**: Cannon.js handles gravity, collisions, and stacking stability, making every drop feel authentic.
- **Dynamic Difficulty**: Each successfully stacked block introduces a smaller moving platform, increasing challenge as your tower grows.
- **Score and Progress Tracking**: Local storage saves your high score; visual feedback shows stack height and stability.
- **Cross-Platform Compatibility**: Fully responsive design optimized for desktop, tablets, and mobile devices with touch/mouse controls.
- **Sound Effects and Animations**: Subtle audio cues and smooth transitions enhance the gameplay experience (optional toggle).



## 🚀 Getting Started

### Play Online
The game is hosted on Vercel and auto-deploys on every push to the main branch. Access the latest version at: [https://3d-blockstack.vercel.app](https://3d-blockstack.vercel.app) (update with your Vercel link).

### Local Development Setup

#### Prerequisites
- A modern browser with WebGL 2.0 support (e.g., Chrome, Firefox, Edge).
- Node.js (v14+) and npm for linting and optional builds.
- No server required—it's a static web app!

#### Installation and Running
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/harshit-sharma2005/3D-Blockstack.git
   cd 3D-Blockstack
   ```

2. **Install Dependencies** (for linting and development tools):
   ```bash
   npm install
   ```

3. **Run Locally**:
   - Simply open `index.html` in your browser (e.g., via `open index.html` on macOS or double-click).
   - For a local server (to avoid CORS issues with modules), use:
     ```bash
     npm start  # If using a tool like live-server; add to package.json if needed
     ```
     Or install and use: `npx live-server`.

4. **Start Playing**: The game loads immediately. Use mouse clicks or touch taps to interact.

## 🎯 How to Play

1. **Initiate the Game**: Click/tap anywhere on the screen to drop the first static base block.
2. **Stack Blocks**: A new block will move horizontally across the screen. Time your click/tap to drop it precisely on top of the previous one.
3. **Alignment Matters**:
   - Perfect overlap: The new block retains full size.
   - Partial overlap: The block is "cut" to fit, reducing size for future blocks and adding instability.
   - Miss completely: Game over—your tower collapses!
4. **Scoring**: Points based on stack height. Beat your high score displayed on-screen.
5. **Controls**:
   - Desktop: Mouse click.
   - Mobile: Touch tap.
   - Restart: Automatic prompt after game over, or refresh the page.
6. **Tips**: Focus on the moving block's shadow for depth perception. Higher stacks wobble more due to physics!

**Goal**: Achieve the highest possible stack without toppling. Share your scores on social media!

## 🛠️ Development and Code Quality

This project follows best practices for maintainability and performance.

### Tech Stack
- **Three.js**: For 3D scene management, meshes, and rendering.
- **Cannon.js**: Physics engine for collisions and gravity.
- **JavaScript (ES6+)**: Core logic in modular files (e.g., `game.js`, `physics.js`).
- **HTML/CSS**: Simple structure with responsive styles.

### Code Quality Tools
- **ESLint**: Enforces JavaScript standards (Airbnb config). Run with `npm run lint:js`.
- **Stylelint**: Maintains CSS consistency. Run with `npm run lint:css`.
- **GitHub Actions**: Automated workflows for linting on push/PR and Vercel previews.
- Custom rules defined in `.eslintrc.js`, `.stylelintrc.json`, and [LINTING.md](./LINTING.md).

To lint and fix issues:
```bash
npm run lint  # Runs both ESLint and Stylelint
npm run lint:fix  # Auto-fixes where possible
```

### Folder Structure
```
/
├── index.html        # Entry point
├── css/styles.css    # Styling
├── js/
│   ├── main.js       # Game initialization
│   ├── stacker.js    # Core game logic
│   └── physics.js    # Cannon.js integration
├── assets/           # Images, sounds (if added)
├── .github/workflows # CI/CD configs
└── LINTING.md        # Detailed linting guide
```

### Testing
- Manual browser testing recommended.
- Add unit tests with Jest in future: `npm test`.

## 🤝 Contributing

We welcome contributions to improve features, fix bugs, or optimize performance! 

1. Fork the repo and create a feature branch (`git checkout -b feature/amazing-idea`).
2. Make changes—ensure they pass linting: `npm run lint`.
3. Commit with descriptive messages (Conventional Commits style).
4. Open a Pull Request referencing any issues.
5. Bonus: Add tests or update docs.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details (create if needed). All contributors must follow the Code of Conduct.

## 🧪 Known Issues and Roadmap
- **Issues**: Physics jitter on low-end mobile devices—optimize with requestAnimationFrame throttling.
- **Future Enhancements**:
  - Leaderboards via Firebase.
  - Multiplayer mode.
  - Custom themes/skins.
  - VR support with WebXR.

Report bugs on GitHub Issues.

## 📝 License

This project is licensed under the MIT License—see the [LICENSE](./LICENSE) file for details. Feel free to use, modify, and distribute! 

Built with ❤️ by [harshit-sharma2005](https://github.com/harshit-sharma2005). Star the repo if you enjoy the game!
