// Vitest setup file for business logic testing
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test setup
beforeAll(() => {
  // Setup that runs once before all tests
  console.log('🧪 Starting Vitest business logic tests...');
});

afterAll(() => {
  // Cleanup that runs once after all tests
  console.log('✅ Vitest business logic tests completed');
});

beforeEach(() => {
  // Setup that runs before each test
  // Reset any global state, clear mocks, etc.
});

afterEach(() => {
  // Cleanup that runs after each test
  // Clear timers, restore mocks, etc.
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';

// Global test utilities (available in all test files)
globalThis.testUtils = {
  mockDate: (date: string | Date) => {
    const mockDate = new Date(date);
    vi.setSystemTime(mockDate);
  },
  restoreDate: () => {
    vi.useRealTimers();
  }
};

// Declare global types for TypeScript
declare global {
  var testUtils: {
    mockDate: (date: string | Date) => void;
    restoreDate: () => void;
  };
}
