import { defineConfig } from '@playwright/test';

export default defineConfig({
  outputDir: 'tests/results',
  retries: 3,
});
