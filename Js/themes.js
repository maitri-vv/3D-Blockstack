// Theme Management for 3D Blockstack Game

// Theme constants
const THEME_STORAGE_KEY = 'stackerTheme';
const DEFAULT_THEME = 'default';
const AVAILABLE_THEMES = ['default', 'night', 'sunset'];

// Theme-specific scene colors
const THEME_COLORS = {
  default: {
    sceneBackground: {
      top: '#ff9f43',
      middle: '#feca57',
      bottom: '#f8e9a1'
    },
    particleColor: 0xffffff,
    particleSpecialColor: 0xffd700,
    blockHueBase: 30
  },
  night: {
    sceneBackground: {
      top: '#0f2027',
      middle: '#203a43',
      bottom: '#2c5364'
    },
    particleColor: 0x4facfe,
    particleSpecialColor: 0x00f2fe,
    blockHueBase: 195
  },
  sunset: {
    sceneBackground: {
      top: '#ff7e5f',
      middle: '#feb47b',
      bottom: '#ffcda5'
    },
    particleColor: 0xf953c6,
    particleSpecialColor: 0xb91d73,
    blockHueBase: 320
  }
};

// Current theme state
let currentTheme = DEFAULT_THEME;

// DOM Elements
const themeButtons = {
  default: document.getElementById('theme-default'),
  night: document.getElementById('theme-night'),
  sunset: document.getElementById('theme-sunset')
};

// Theme management functions
function initThemes() {
  // Load saved theme from localStorage
  loadTheme();

  // Add event listeners to theme buttons
  for (const theme of AVAILABLE_THEMES) {
    const button = themeButtons[theme];
    if (button) {
      button.addEventListener('click', () => setTheme(theme));
    }
  }
}

function loadTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme && AVAILABLE_THEMES.includes(savedTheme)) {
      setTheme(savedTheme, false); // Don't save again when loading
    }
  } catch (error) {
    console.warn('Could not load theme from localStorage:', error);
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Could not save theme to localStorage:', error);
  }
}

function setTheme(theme, save = true) {
  // Validate theme
  if (!AVAILABLE_THEMES.includes(theme)) {
    console.error(`Invalid theme: ${theme}`);
    return;
  }

  // Update current theme
  currentTheme = theme;

  // Update body class
  document.body.classList.remove(...AVAILABLE_THEMES.map(t => `theme-${t}`));
  if (theme !== 'default') {
    document.body.classList.add(`theme-${theme}`);
  }

  // Update active button state
  for (const t of AVAILABLE_THEMES) {
    const button = themeButtons[t];
    if (button) {
      button.classList.toggle('active', t === theme);
    }
  }

  // Update scene colors if the game has started
  if (typeof updateSceneColors === 'function') {
    updateSceneColors();
  }

  // Save theme preference if requested
  if (save) {
    saveTheme(theme);
  }
}

// Function to get current theme colors
function getCurrentThemeColors() {
  return THEME_COLORS[currentTheme];
}

// Initialize themes when DOM is loaded
document.addEventListener('DOMContentLoaded', initThemes);

// Export theme functions for use in main script
window.themeManager = {
  getCurrentTheme: () => currentTheme,
  getCurrentThemeColors,
  setTheme
};