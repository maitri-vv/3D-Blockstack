
// ============================================================
// Theme Management for 3D BlockStack
// ============================================================

const THEME_STORAGE_KEY = "stackerTheme";
const DEFAULT_THEME = "default";

const AVAILABLE_THEMES = [
  "default",
  "night",
  "sunset"
];


// ============================================================
// Theme Colors
// ============================================================

const THEME_COLORS = {
  default: {
    sceneBackground: {
      top: "#ff9f43",
      middle: "#feca57",
      bottom: "#f8e9a1"
    },

    particleColor: 0xffffff,
    particleSpecialColor: 0xffd700,

    blockHueBase: 30
  },

  night: {
    sceneBackground: {
      top: "#0f2027",
      middle: "#203a43",
      bottom: "#2c5364"
    },

    particleColor: 0x4facfe,
    particleSpecialColor: 0x00f2fe,

    blockHueBase: 195
  },

  sunset: {
    sceneBackground: {
      top: "#ff7e5f",
      middle: "#feb47b",
      bottom: "#ffcda5"
    },

    particleColor: 0xf953c6,
    particleSpecialColor: 0xb91d73,

    blockHueBase: 320
  }
};


// ============================================================
// Current Theme
// ============================================================

let currentTheme = DEFAULT_THEME;


// ============================================================
// Theme Buttons
// ============================================================

const themeButtons = {
  default: document.getElementById("theme-default"),
  night: document.getElementById("theme-night"),
  sunset: document.getElementById("theme-sunset")
};


// ============================================================
// Load Theme
// ============================================================

function loadTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (
      savedTheme &&
      AVAILABLE_THEMES.includes(savedTheme)
    ) {
      setTheme(savedTheme, false);
    } else {
      setTheme(DEFAULT_THEME, false);
    }
  } catch (error) {
    // localStorage can be unavailable in some environments.
    // The game should still work normally.
    setTheme(DEFAULT_THEME, false);
  }
}


// ============================================================
// Save Theme
// ============================================================

function saveTheme(theme) {
  try {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      theme
    );
  } catch (error) {
    // Theme persistence is optional.
    // Never allow a storage failure to interrupt gameplay.
  }
}


// ============================================================
// Set Theme
// ============================================================

function setTheme(theme, save = true) {
  if (!AVAILABLE_THEMES.includes(theme)) {
    return;
  }

  currentTheme = theme;


  // ----------------------------------------------------------
  // Update body theme class
  // ----------------------------------------------------------

  document.body.classList.remove(
    ...AVAILABLE_THEMES.map(
      (themeName) => `theme-${themeName}`
    )
  );

  if (theme !== DEFAULT_THEME) {
    document.body.classList.add(
      `theme-${theme}`
    );
  }


  // ----------------------------------------------------------
  // Update active button
  // ----------------------------------------------------------

  for (const themeName of AVAILABLE_THEMES) {
    const button = themeButtons[themeName];

    if (button) {
      button.classList.toggle(
        "active",
        themeName === theme
      );
    }
  }


  // ----------------------------------------------------------
  // Update Three.js scene
  // ----------------------------------------------------------

  if (
    typeof updateSceneColors === "function"
  ) {
    updateSceneColors();
  }


  // ----------------------------------------------------------
  // Persist preference
  // ----------------------------------------------------------

  if (save) {
    saveTheme(theme);
  }
}


// ============================================================
// Get Current Theme Colors
// ============================================================

function getCurrentThemeColors() {
  return (
    THEME_COLORS[currentTheme] ||
    THEME_COLORS[DEFAULT_THEME]
  );
}


// ============================================================
// Initialize Themes
// ============================================================

function initThemes() {
  for (const theme of AVAILABLE_THEMES) {
    const button = themeButtons[theme];

    if (!button) {
      continue;
    }

    button.addEventListener(
      "click",
      () => {
        setTheme(theme);
      }
    );
  }

  loadTheme();
}


// ============================================================
// DOM Initialization
// ============================================================

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initThemes,
    { once: true }
  );
} else {
  initThemes();
}


// ============================================================
// Public Theme API
// ============================================================

window.themeManager = {
  getCurrentTheme: () => currentTheme,

  getCurrentThemeColors,

  setTheme
};
