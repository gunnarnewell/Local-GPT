import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['app/main/__tests__/**/*.test.ts']
  }
});
