import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ElectronApplication, Page, _electron as electron, expect, test } from '@playwright/test';

// Starts the app on the settings file an older version left behind.
let appElectron: ElectronApplication;
let appWindow: Page;
let userDataDir: string;

// The same blank movie the main suite plays.
const BLANK_SWF = Buffer.from(
  '4657530a1e0000007800055f00000fa000001801004302ffffff40000000',
  'hex',
);

// The repository leaves Ruffle out, so a run without it skips what needs a movie.
const hasRuffle = existsSync('dist/js/ruffle/ruffle.js');

const readStoredConfig = () => JSON.parse(readFileSync(join(userDataDir, 'config.json'), 'utf8'));

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  userDataDir = mkdtempSync(join(tmpdir(), 'flare-player-e2e-stored-'));
  // The settings are read before the app is ready, so they have to be there at
  // launch.
  writeFileSync(
    join(userDataDir, 'config.json'),
    JSON.stringify({
      letterbox: false,
      appConfigQuality: 'high',
      hardwareAcceleration: false,
    }),
  );

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

test('A letterbox that was turned off becomes the never mode', async () => {
  const config = readStoredConfig();

  expect(config.letterboxMode).toBe('off');
  expect(config).not.toHaveProperty('letterbox');
  // The quality default used to sit under a key nothing read.
  expect(config).not.toHaveProperty('appConfigQuality');
  expect(config.quality).toBe('high');

  await appWindow.getByRole('button', { name: 'Settings' }).click();

  const dialog = appWindow.getByRole('dialog', { name: 'Settings' });

  await dialog.getByRole('button', { name: 'Emulation', exact: true }).click();
  await expect(
    dialog.getByRole('region', { name: 'Letterbox' }).getByRole('radio', { name: 'Never' }),
  ).toBeChecked();

  await appWindow.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('The app starts without hardware acceleration when it is turned off', async () => {
  expect(await appElectron.evaluate(({ app }) => app.isHardwareAccelerationEnabled())).toBe(false);

  await appWindow.getByRole('button', { name: 'Settings' }).click();

  const dialog = appWindow.getByRole('dialog', { name: 'Settings' });

  await dialog.getByRole('button', { name: 'Advanced', exact: true }).click();

  // The box shows the value this run started with, so nothing waits for a restart.
  await expect(
    dialog.getByRole('checkbox', { name: 'Use hardware acceleration' }),
  ).not.toBeChecked();
  await expect(
    dialog.getByText('You must restart the app for the changes to take effect!'),
  ).toBeHidden();

  await appWindow.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('A movie still plays without hardware acceleration', async () => {
  test.skip(!hasRuffle, 'Ruffle is not in dist/js/ruffle');

  const swfPath = join(userDataDir, 'blank.swf');

  writeFileSync(swfPath, BLANK_SWF);
  await appElectron.evaluate(
    ({ BrowserWindow }, filePath) =>
      BrowserWindow.getAllWindows()[0].webContents.send('receiveOpenFile', filePath),
    swfPath,
  );

  // Width and height come from the movie itself, so they prove Ruffle read it.
  await expect
    .poll(() =>
      appWindow.evaluate(() => (document.querySelector('#player') as any)?.metadata?.width),
    )
    .toBe(550);
  expect(
    await appWindow.evaluate(
      () => (document.querySelector('#player') as any)?.loadedConfig?.preferredRenderer,
    ),
  ).toBe('canvas');
});
