import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['**/*.ts'],
      exclude: [
        'src/main.tsx',
        'vite.config.ts',
        'vitest.config.ts',
        'vitest.setup.ts',
        '__tests__/**',
        'dist/**',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 55,
      },
    },
  },
});
