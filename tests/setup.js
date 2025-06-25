// Configurações globais para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_NAME = 'stock_control_test';

// Configurações de timeout global
jest.setTimeout(10000);

// Mock do console.log para reduzir ruído nos testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Configurações globais para fetch
global.fetch = jest.fn();

// Limpar mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});