import { defineConfig } from '@playwright/test';

export default defineConfig({
  outputDir: 'tests/results',
  retries: process.env.E2E ? 2 : 0,
  workers: process.env.E2E ? 1 : undefined,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
});
