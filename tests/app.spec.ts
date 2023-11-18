import { Page, _electron as electron } from 'playwright';
import { ElectronApplication } from 'playwright-core';
import { test, expect } from '@playwright/test';

let appWindow: Page;
let appElectron: ElectronApplication;

function existElementByTestId(selector: string, waitingMilliseconds = 100) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      await expect(
        appWindow.getByTestId(selector).first(),
        `Confirm selector '${selector}' is visible`,
      ).toBeVisible();
      resolve(true);
    }, waitingMilliseconds);
  });
}

test.beforeAll(async () => {
  // Open Electron app from build directory
  appElectron = await electron.launch({
    args: ['dist/main/index.js'],
    locale: 'en-US',
    colorScheme: 'light',
    env: {
      ...process.env,
      E2E: 'yes',
      NODE_ENV: 'production',
    },
  });
  appWindow = await appElectron.firstWindow();

  await appWindow.waitForEvent('domcontentloaded');
});

test('Environment check', async () => {
  const isPackaged = await appElectron.evaluate(async ({ app }) => app.isPackaged);

  expect(isPackaged, 'Confirm that is in development mode').toBe(false);
});

test('Document element check', async () => {
  await existElementByTestId('uiFileOpen');
});

test.afterAll(async () => {
  await appWindow.waitForTimeout(2000);
  await appElectron.close();
});
