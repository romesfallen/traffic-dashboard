import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run tests in Node environment (for API tests)
    environment: 'node',
    
    // Include test files
    include: ['tests/**/*.test.js'],
    
    // Coverage settings (optional, run with npm run test:coverage)
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      reporter: ['text', 'html'],
    },
    
    // Timeout for slow tests
    testTimeout: 10000,
  },
});
