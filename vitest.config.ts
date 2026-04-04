import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['shared/src/**/*.test.ts', 'backend/src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
    },
  },
});
