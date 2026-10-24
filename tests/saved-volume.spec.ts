import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ElectronApplication, Page, _electron as electron, expect, test } from '@playwright/test';

// The same blank movie the main suite plays.
const BLANK_SWF = Buffer.from(
  '4657530a1e0000007800055f00000fa000001801004302ffffff40000000',
  'hex',
);

// The repository leaves Ruffle out, so a run without it skips what needs a movie.
const hasRuffle = existsSync('dist/js/ruffle/ruffle.js');

let appElectron: ElectronApplication;
let appWindow: Page;
let userDataDir: string;

const readStoredConfig = () => JSON.parse(readFileSync(join(userDataDir, 'config.json'), 'utf8'));

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  userDataDir = mkdtempSync(join(tmpdir(), 'flare-player-e2e-volume-'));
  // The level and the mute state a previous run left behind.
  writeFileSync(
    join(userDataDir, 'config.json'),
    JSON.stringify({ playerVolume: 40, playerMuted: true }),
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

test('The player starts at the volume and mute state left last time', async () => {
  test.skip(!hasRuffle, 'Ruffle is not in dist/js/ruffle');

  const swfPath = join(userDataDir, 'blank.swf');
  const slider = appWindow.getByRole('slider', { name: 'Volume' });
  const mute = appWindow.getByRole('checkbox', { name: 'Mute' });
  const movieVolume = () =>
    appWindow.evaluate(() => (document.getElementById('player') as any)?.volume);

  writeFileSync(swfPath, BLANK_SWF);
  await expect(appWindow.getByRole('button', { name: 'Settings' })).toBeVisible();
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
  await expect.poll(movieVolume).toBe(0);

  await appWindow.getByRole('button', { name: 'Volume' }).click();
  await expect(slider).toHaveValue('40');
  await expect(mute).toBeChecked();

  await mute.click();
  await expect.poll(movieVolume).toBeCloseTo(0.4);
  await expect.poll(() => readStoredConfig().playerMuted).toBe(false);
  await appWindow.keyboard.press('Escape');
});
