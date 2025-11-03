# Contributing to 3D-Blockstack

Thank you for your interest in contributing to 3D-Blockstack! This document provides guidelines to help you contribute effectively and maintain consistent code quality across the project.

## 🚀 How to Contribute

### 1. Fork and Clone
1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/maitri-vv/3D-Blockstack.git
   cd 3D-Blockstack
   ```

### 2. Create a Branch
Create a new branch for your feature or fix:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/issue-description
# or
git checkout -b enhancement/improvement-name
```

### 3. Make Your Changes
- Write clean, readable code
- Follow the code style guidelines below
- Test your changes locally
- Ensure the game runs without errors

### 4. Commit Your Changes
Use descriptive commit messages following our format:
```bash
git add .
git commit -m "[Feature] Add particle explosion effect on block placement"
```

### 5. Push and Submit Pull Request
```bash
git push origin your-branch-name
```
Then create a Pull Request on GitHub with:
- Clear title describing the change
- Detailed description of what was changed and why
- Screenshots/GIFs if the change affects visuals
- Reference any related issues

## 📝 Code Style Guidelines

### JavaScript Style
- **Semicolons**: Always use semicolons at the end of statements
- **Indentation**: Use 2 spaces (no tabs)
- **Variable Naming**: Use camelCase for variables and functions
  ```javascript
  // ✅ Good
  const boxHeight = 1;
  const originalBoxSize = 3;
  function createRingEffect(x, y, z) { }
  
  // ❌ Avoid
  const box_height = 1;
  const OriginalBoxSize = 3;
  function create_ring_effect(x, y, z) { }
  ```
- **Constants**: Use UPPER_SNAKE_CASE for constants
  ```javascript
  const MAX_STACK_HEIGHT = 100;
  const DEFAULT_CAMERA_POSITION = { x: 3, y: 3, z: 3 };
  ```
- **Function Declarations**: Use function declarations for main functions, arrow functions for callbacks
  ```javascript
  // ✅ Main functions
  function addLayer(x, z, width, depth, direction) { }
  
  // ✅ Callbacks and short functions
  const animate = () => { };
  overhangs.forEach((element) => { });
  ```

### CSS Style
- **Indentation**: Use 2 spaces
- **Property Order**: Group related properties together
- **Colors**: Use hex values for colors, prefer lowercase
- **Selectors**: Use kebab-case for class names
  ```css
  /* ✅ Good */
  .game-container {
    position: absolute;
    top: 10px;
    left: 50%;
    color: #ffffff;
  }
  
  /* ❌ Avoid */
  .gameContainer {
    color: WHITE;
    top: 10px;
    position: absolute;
    left: 50%;
  }
  ```

### HTML Style
- **Indentation**: Use 2 spaces
- **Attributes**: Use double quotes
- **IDs and Classes**: Use kebab-case
- **Semantic Elements**: Use appropriate semantic HTML elements

## 📋 Commit Message Format

Use the following prefixes for commit messages:

- **[Feature]** - New functionality or game features
  ```
  [Feature] Add rainbow particle effects when reaching high scores
  [Feature] Implement mobile touch controls with haptic feedback
  ```

- **[Bugfix]** - Bug fixes and error corrections
  ```
  [Bugfix] Fix camera positioning on window resize
  [Bugfix] Resolve block collision detection issues
  ```

- **[Enhancement]** - Improvements to existing features
  ```
  [Enhancement] Improve particle system performance
  [Enhancement] Optimize Three.js rendering for mobile devices
  ```

- **[Style]** - Code formatting, styling, or visual improvements
  ```
  [Style] Update color scheme and gradient backgrounds
  [Style] Refactor CSS for better organization
  ```

- **[Docs]** - Documentation updates
  ```
  [Docs] Update README with new gameplay instructions
  [Docs] Add code comments for physics calculations
  ```

- **[Refactor]** - Code restructuring without changing functionality
  ```
  [Refactor] Reorganize game initialization functions
  [Refactor] Extract particle system into separate module
  ```

## 🧪 Testing Guidelines

### Local Testing Requirements
Before submitting your Pull Request:

1. **Functionality Testing**
   - Open `index.html` in multiple browsers (Chrome, Firefox, Safari, Edge)
   - Test on both desktop and mobile devices
   - Verify all game mechanics work correctly:
     - Block stacking and cutting
     - Physics simulation
     - Score tracking
     - Game restart functionality

2. **Performance Testing**
   - Ensure smooth 60fps gameplay
   - Check for memory leaks during extended play
   - Verify particle effects don't cause frame drops

3. **Visual Testing**
   - Confirm visual effects render correctly
   - Test responsive design on different screen sizes
   - Verify color schemes and animations work as expected

4. **Input Testing**
   - Test mouse clicks, keyboard inputs (Space, R key)
   - Verify touch controls on mobile devices
   - Ensure all input methods trigger correct responses

### Browser Compatibility
Ensure your changes work on:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Issue Reporting

### Reporting Bugs
When reporting bugs, please include:

1. **Clear Title**: Descriptive summary of the issue
2. **Environment Details**:
   - Browser name and version
   - Operating system
   - Device type (desktop/mobile)
   - Screen resolution (if relevant)

3. **Steps to Reproduce**:
   ```
   1. Open the game in Chrome
   2. Stack 5 blocks successfully
   3. Click when the 6th block is moving
   4. Observe the collision detection error
   ```

4. **Expected vs Actual Behavior**:
   - What should happen
   - What actually happens

5. **Screenshots/Videos**: Include visual evidence when possible

6. **Console Errors**: Include any JavaScript errors from browser console

### Suggesting Features
For feature requests, please provide:

1. **Feature Description**: Clear explanation of the proposed feature
2. **Use Case**: Why this feature would be valuable
3. **Implementation Ideas**: Any thoughts on how it could be implemented
4. **Examples**: References to similar features in other games (if applicable)

## 🎯 Areas for Contribution

We welcome contributions in these areas:

### Game Features
- New visual effects and animations
- Sound effects and audio integration
- Additional game modes or difficulty levels
- Power-ups and special blocks
- Leaderboard and score persistence

### Technical Improvements
- Performance optimizations
- Mobile responsiveness enhancements
- Accessibility improvements
- Code organization and documentation
- Browser compatibility fixes

### Visual Enhancements
- New color schemes and themes
- Particle effects and animations
- UI/UX improvements
- Mobile-first design improvements

## 📞 Getting Help

If you need help or have questions:

1. **Check existing issues** for similar questions
2. **Create a new issue** with the "question" label
3. **Be specific** about what you're trying to achieve
4. **Include relevant code** if you're stuck on implementation

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special thanks for major features or bug fixes

Thank you for contributing to 3D-Blockstack! Your efforts help make this game better for everyone. 🚀

---

*This document is a living guide and may be updated as the project evolves.*
