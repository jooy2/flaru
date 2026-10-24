import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ElectronApplication, Page, _electron as electron, expect, test } from '@playwright/test';

let appWindow: Page;
let appElectron: ElectronApplication;
let userDataDir: string;

// Every test drives the same app instance, one step after another.
test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  userDataDir = mkdtempSync(join(tmpdir(), 'flare-player-e2e-'));

  // Open Electron app from build directory
  appElectron = await electron.launch({
    args: ['dist/main/index.js'],
    locale: 'en-US',
    colorScheme: 'light',
    env: {
      ...process.env,
      E2E: 'yes',
      E2E_USER_DATA_DIR: userDataDir,
      NODE_ENV: 'production',
    },
  });
  appWindow = await appElectron.firstWindow();

  await appWindow.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  await appElectron?.close();
  rmSync(userDataDir, { recursive: true, force: true });
});

test('Environment check', async () => {
  const isPackaged = await appElectron.evaluate(async ({ app }) => app.isPackaged);

  expect(isPackaged, 'Confirm that is in development mode').toBe(false);
});

test('App data is kept apart from the real profile', async () => {
  const userData = await appElectron.evaluate(({ app }) => app.getPath('userData'));

  expect(userData).toBe(userDataDir);
});

test('Window stays hidden during the test run', async () => {
  const visibleWindows = await appElectron.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows().filter((win) => win.isVisible()),
  );

  expect(visibleWindows).toHaveLength(0);
});

test('Document element check', async () => {
  await expect(appWindow.getByTestId('uiFileOpen').first()).toBeVisible();
});
