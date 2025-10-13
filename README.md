# 3D Block Stack Game

[![Code Quality Check](https://github.com/harshit-sharma2005/3D-Blockstack/actions/workflows/lint.yml/badge.svg)](https://github.com/harshit-sharma2005/3D-Blockstack/actions/workflows/lint.yml)
[![Vercel Preview](https://github.com/harshit-sharma2005/3D-Blockstack/actions/workflows/vercel-preview.yml/badge.svg)](https://github.com/harshit-sharma2005/3D-Blockstack/actions/workflows/vercel-preview.yml)

A fun 3D block stacking game built with Three.js and Cannon.js physics engine.

## 🎮 Game Features

- **3D Graphics**: Rendered using Three.js for smooth 3D visuals
- **Physics Engine**: Powered by Cannon.js for realistic block physics
- **Progressive Difficulty**: Blocks get smaller as you stack higher
- **Score Tracking**: Keep track of your highest stack
- **Responsive Design**: Works on both desktop and mobile devices

## 🚀 Play Online

The game is automatically deployed to Vercel on every push. You can play it live at your deployed URL.

## 🛠️ Development

### Prerequisites
- A modern web browser with WebGL support
- Basic knowledge of HTML, CSS, and JavaScript

### Local Development
1. Clone the repository
2. Open `index.html` in your web browser
3. Start stacking blocks!

### Code Quality
This project uses automated linting to maintain code quality:
- **ESLint** for JavaScript code style and error detection
- **Stylelint** for CSS formatting and best practices
- Automated checks run on every push and pull request

## 🎯 How to Play

1. **Start**: Click anywhere to drop the first block
2. **Stack**: Click when the moving block is aligned with the stack
3. **Precision**: Perfect alignment keeps the block full size
4. **Challenge**: Misaligned blocks get trimmed, making subsequent blocks smaller
5. **Goal**: Stack as many blocks as possible!

## 🤝 Contributing

Contributions are welcome! Please ensure your code passes the linting checks.

**Quick Start:**
```bash
npm install
npm run lint
```

For detailed information about code quality requirements, see [LINTING.md](./LINTING.md).

## 📝 License

This project is open source and available under the MIT License.
