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
    'indent': ['warn', 2, { SwitchCase: 1 }],
    'no-trailing-spaces': 'warn',
    'eol-last': 'warn',
    'no-mixed-spaces-and-tabs': 'error',
    'space-before-blocks': ['warn', 'always']
  },
  globals: {
    'THREE': 'readonly',
    'CANNON': 'readonly',
    'TWEEN': 'readonly'
  }
};