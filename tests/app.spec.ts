import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import electronPath from 'electron';
import { ElectronApplication, Page, _electron as electron, expect, test } from '@playwright/test';

// The smallest movie Ruffle will play: an uncompressed SWF 10 header with a
// 550x400 stage at 24 fps and one frame, then SetBackgroundColor (white),
// ShowFrame and End.
const BLANK_SWF = Buffer.from(
  '4657530a1e0000007800055f00000fa000001801004302ffffff40000000',
  'hex',
);

// The blank movie, with a DoAction tag that runs
// `getURL(url, target)` in the long tag form, since an address does not fit
// the short one.
const getUrlSwf = (url: string, target: string) => {
  const args = Buffer.from(`${url}\0${target}\0`, 'latin1');
  const getUrl = Buffer.alloc(3);
  const tagHeader = Buffer.alloc(6);
  const fileHeader = Buffer.alloc(8);

  getUrl.writeUInt8(0x83, 0);
  getUrl.writeUInt16LE(args.length, 1);

  const actions = Buffer.concat([getUrl, args, Buffer.from([0x00])]);

  tagHeader.writeUInt16LE((12 << 6) | 0x3f, 0);
  tagHeader.writeUInt32LE(actions.length, 2);

  const body = Buffer.concat([
    Buffer.from('7800055f00000fa000001801004302ffffff', 'hex'),
    tagHeader,
    actions,
    Buffer.from('40000000', 'hex'),
  ]);

  fileHeader.write('FWS', 0, 'latin1');
  fileHeader.writeUInt8(10, 3);
  fileHeader.writeUInt32LE(fileHeader.length + body.length, 4);

  return Buffer.concat([fileHeader, body]);
};

// The hash route the window shows, read from the main process, since a page
// that is navigating does not answer Playwright.
const windowRoute = () =>
  appElectron.evaluate(({ BrowserWindow }) =>
    new URL(BrowserWindow.getAllWindows()[0].webContents.getURL()).hash.replace(/^#/, ''),
  );

// Starts the app again with the same app data and `args` on its command line,
// as a file manager does, and resolves with its exit code.
const launchAgain = (args: string[]) =>
  new Promise<number | null>((resolve, reject) => {
    const child = spawn(electronPath as unknown as string, ['dist/main/index.js', ...args], {
      env: { ...process.env, E2E: 'yes', E2E_USER_DATA_DIR: userDataDir, NODE_ENV: 'production' },
      stdio: 'ignore',
    });

    child.once('error', reject);
    child.once('exit', resolve);
  });

let appWindow: Page;
let appElectron: ElectronApplication;
let userDataDir: string;
let fixturesDir: string;
const pageErrors: Error[] = [];

// The main process records what it would hand to the system browser.
const recordExternalLinks = () =>
  appElectron.evaluate(({ shell }) => {
    const opened: string[] = [];

    (globalThis as any).openedExternally = opened;
    (shell as any).openExternal = async (url: string) => {
      opened.push(url);
    };
  });

const openedExternally = () => appElectron.evaluate(() => (globalThis as any).openedExternally);

// Every test drives the same app instance, one step after another.
test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  userDataDir = mkdtempSync(join(tmpdir(), 'flare-player-e2e-'));
  fixturesDir = join(userDataDir, 'fixtures');
  mkdirSync(fixturesDir);

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
  appWindow.on('pageerror', (error) => {
    pageErrors.push(error);
  });

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

test('A new profile starts on the default graphics quality', async () => {
  await appWindow.getByRole('button', { name: 'settings' }).click();

  const dialog = appWindow.getByRole('dialog', { name: 'Settings' });

  await expect(dialog.getByRole('radio', { name: 'High (recommended)' })).toBeChecked();
  await dialog.getByRole('button', { name: 'Close' }).last().click();
  await expect(dialog).toBeHidden();
});

test('A page never opens a window of the app, and a web address goes to the browser', async () => {
  await recordExternalLinks();
  await appWindow.evaluate(() => {
    window.open('https://example.com/page', '_blank');
    window.open('http://example.com/other');
    window.open('file:///etc/hosts');
  });

  await expect
    .poll(openedExternally)
    .toEqual(['https://example.com/page', 'http://example.com/other']);
  expect(
    await appElectron.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length),
  ).toBe(1);
});

test('A movie cannot take the app window to another page, and its address goes to the browser', async () => {
  const swfPath = join(fixturesDir, 'Navigate Movie.swf');
  const windowUrl = () =>
    appElectron.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].webContents.getURL(),
    );
  // Playwright waits on the navigation the page asked for, which never starts,
  // so the page is read from the main process from here on.
  const runInWindow = (code: string) =>
    appElectron.evaluate(
      ({ BrowserWindow }, script) =>
        BrowserWindow.getAllWindows()[0].webContents.executeJavaScript(script),
      code,
    );

  await recordExternalLinks();
  // Ruffle asks before it opens an address, and the reader answers OK.
  await appWindow.evaluate(() => {
    window.confirm = () => true;
  });

  writeFileSync(swfPath, getUrlSwf('https://example.com/from-movie', '_self'));
  await appElectron.evaluate(
    ({ BrowserWindow }, filePath) =>
      BrowserWindow.getAllWindows()[0].webContents.send('receiveOpenFile', filePath),
    swfPath,
  );

  await expect.poll(openedExternally).toEqual(['https://example.com/from-movie']);
  expect(await windowUrl()).toMatch(/index\.html#\/player$/);
  expect(await runInWindow("!!document.querySelector('#player')")).toBe(true);
});

test('A second launch opens its SWF file in the window already open, and quits', async () => {
  const swfPath = join(fixturesDir, 'Second Launch.swf');

  writeFileSync(swfPath, BLANK_SWF);
  await appWindow.evaluate(() => {
    window.location.hash = '#/explorer';
  });
  await expect.poll(windowRoute).toBe('/explorer');

  // A plain path, as Windows passes it, and a `file://` address, as a Linux file
  // manager may.
  for (const arg of [swfPath, pathToFileURL(swfPath).href]) {
    expect(await launchAgain(['--some-switch', arg])).toBe(0);
    await expect.poll(windowRoute).toBe('/player');
    await expect(appWindow).toHaveTitle('Second Launch.swf - Flare Flash Player');
    await appWindow.evaluate(() => {
      window.location.hash = '#/explorer';
    });
    await expect.poll(windowRoute).toBe('/explorer');
  }

  expect(
    await appElectron.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length),
  ).toBe(1);
});

test('No uncaught errors were thrown in the renderer', async () => {
  expect(pageErrors.map((error) => error.message)).toEqual([]);
});
