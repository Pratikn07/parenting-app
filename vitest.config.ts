import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // For business logic tests (not React Native components)
    setupFiles: ['./src/__tests__/setup.vitest.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json'],
      include: [
        'src/services/**/*.ts',
        'src/lib/**/*.ts', 
        'src/shared/**/*.ts'
      ],
      exclude: [
        '**/*.d.ts',
        '**/__tests__/**',
        '**/index.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    // Test file patterns (separate from Jest patterns)
    include: [
      'src/**/*.{unit,business}.test.ts',
      'src/**/*.{unit,business}.spec.ts'
    ],
    exclude: [
      '**/*.{integration,component,e2e}.test.ts',
      'node_modules/**',
      'dist/**'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@services': path.resolve(__dirname, './src/services'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@types': path.resolve(__dirname, './src/shared/types')
    }
  }
});
