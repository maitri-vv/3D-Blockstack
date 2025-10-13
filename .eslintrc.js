module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'script'
  },
  rules: {
    'no-unused-vars': 'error',
    'no-undef': 'error',
    'no-console': 'warn',
    'semi': ['error', 'always'],
    'quotes': ['warn', 'double'],
    'indent': ['warn', 2],
    'no-trailing-spaces': 'warn',
    'eol-last': 'warn'
  },
  globals: {
    'THREE': 'readonly',
    'CANNON': 'readonly',
    'TWEEN': 'readonly'
  }
};