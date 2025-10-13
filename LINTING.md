# Code Quality & Linting Guide

This project uses automated linting to maintain code quality and consistency across JavaScript and CSS files.

## 🔧 Setup

The linting tools are automatically configured for this project. No additional setup is required for the GitHub Actions workflow.

For local development, install the dependencies:

```bash
npm install
```

## 🚀 Running Linting

### Automatic (GitHub Actions)
- Linting runs automatically on every **push** and **pull request** to the `main` branch
- The workflow checks `script.js` and `style.css` for code quality issues
- CI will pass if there are no critical errors (warnings are allowed up to a threshold)

### Manual (Local Development)

```bash
# Run all linting checks
npm run lint

# Run JavaScript linting only
npm run lint:js

# Run CSS linting only
npm run lint:css

# Auto-fix issues where possible
npm run lint:fix
```

## 📋 What's Being Checked

### JavaScript (`script.js`)
- **Syntax errors** - undefined variables, missing semicolons
- **Code style** - indentation, quote consistency
- **Best practices** - unused variables, console statements
- **Global variables** - THREE.js, CANNON.js, TWEEN.js are recognized

### CSS (`style.css`)
- **Syntax validation** - proper CSS structure
- **Style consistency** - formatting and organization
- **Best practices** - duplicate selectors, proper quotes

## 🎯 Thresholds

- **JavaScript**: Up to 60 warnings allowed (focuses on critical errors)
- **CSS**: Up to 10 warnings allowed
- **Errors**: Any errors will fail the CI check

## 🛠️ Configuration Files

- `.eslintrc.js` - ESLint configuration for JavaScript
- `.stylelintrc.json` - Stylelint configuration for CSS
- `.eslintignore` - Files to exclude from JavaScript linting
- `.stylelintignore` - Files to exclude from CSS linting

## 🔍 Understanding Output

### ESLint Output
- `error` - Must be fixed (will fail CI)
- `warning` - Should be fixed (allowed up to threshold)

### Stylelint Output
- `✖` - Issues found that should be addressed

## 🚫 Common Issues & Fixes

### Trailing Spaces
```bash
# Auto-fix trailing spaces
npm run lint:fix
```

### Indentation
Use consistent 2-space indentation throughout the codebase.

### Quotes
Prefer double quotes (`"`) in both JavaScript and CSS.

## 📈 Status Badge

The repository includes a status badge showing the current linting status:

[![Code Quality Check](https://github.com/harshit-sharma2005/3D-Blockstack/actions/workflows/lint.yml/badge.svg)](https://github.com/harshit-sharma2005/3D-Blockstack/actions/workflows/lint.yml)

## 🤝 Contributing

Before submitting a pull request:

1. Run `npm run lint` locally
2. Fix any critical errors
3. Address warnings when possible
4. The GitHub Actions workflow will validate your changes

This ensures consistent code quality across all contributions!