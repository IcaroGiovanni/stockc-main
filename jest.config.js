module.exports = {
  // Diretório raiz dos testes
  testEnvironment: 'node',

  // Diretórios onde procurar por testes
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js'
  ],

  // Diretórios a serem ignorados
  testPathIgnorePatterns: [
    '/node_modules/',
    '/public/',
    '/uploads/'
  ],

  // Cobertura de código
  collectCoverageFrom: [
    'server.js',
    'migration.js',
    'public/js/**/*.js',
    '!**/node_modules/**',
    '!**/public/lib/**'
  ],

  // Configurações de cobertura
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Configurações de setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Timeout para testes
  testTimeout: 10000,

  // Configurações de verbose
  verbose: true,

  // Configurações de transform
  transform: {},

  // Configurações de módulos
  moduleFileExtensions: ['js', 'json'],

  // Configurações de ambiente
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  }
};