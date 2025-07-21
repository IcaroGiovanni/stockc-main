module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // Regras de estilo
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],

    // Regras de variáveis
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-undef': 'error',
    'no-var': 'error',
    'prefer-const': 'error',

    // Regras de funções
    'no-empty-function': 'warn',
    'prefer-arrow-callback': 'error',

    // Regras de objetos e arrays
    'object-shorthand': 'error',
    'prefer-template': 'error',

    // Regras de segurança
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Regras de performance
    'no-loop-func': 'error',
    'no-unused-expressions': 'error',

    // Regras de legibilidade
    'max-len': ['warn', { 'code': 100 }],
    'no-multiple-empty-lines': ['error', { 'max': 2 }],
    'no-trailing-spaces': 'error',

    // Regras específicas para Node.js
    'no-process-exit': 'error',
    'no-path-concat': 'error',

    // Regras para async/await
    'no-async-promise-executor': 'error',
    'require-await': 'warn',

    // Regras para console (permitir em desenvolvimento)
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

    // Regras para debugger
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn'
  },
  overrides: [
    {
      // Configurações específicas para arquivos de teste
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off',
        'no-undef': 'off'
      }
    },
    {
      // Configurações específicas para arquivos frontend
      files: ['public/js/**/*.js'],
      env: {
        browser: true
      },
      rules: {
        'no-console': 'off',
        'no-alert': 'warn'
      }
    }
  ],
  globals: {
    // Variáveis globais do browser
    'document': 'readonly',
    'window': 'readonly',
    'localStorage': 'readonly',
    'fetch': 'readonly',

    // Variáveis globais do Node.js
    'process': 'readonly',
    'Buffer': 'readonly',
    '__dirname': 'readonly',
    '__filename': 'readonly',

    // Variáveis globais de teste
    'describe': 'readonly',
    'it': 'readonly',
    'test': 'readonly',
    'expect': 'readonly',
    'beforeEach': 'readonly',
    'afterEach': 'readonly',
    'beforeAll': 'readonly',
    'afterAll': 'readonly',
    'jest': 'readonly'
  }
};