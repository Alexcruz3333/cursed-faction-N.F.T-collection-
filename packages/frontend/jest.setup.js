// jest.setup.js
import 'whatwg-fetch'

// Mock global fetch for tests
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}