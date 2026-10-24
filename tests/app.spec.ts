import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import electronPath from 'electron';
import {
  ElectronApplication,
  Locator,
  Page,
  _electron as electron,
  expect,
  test,
} from '@playwright/test';

// The smallest movie Ruffle will play: an uncompressed SWF 10 header with a
// 550x400 stage at 24 fps and one frame, then SetBackgroundColor (white),
// ShowFrame and End.
const BLANK_SWF = Buffer.from(
  '4657530a1e0000007800055f00000fa000001801004302ffffff40000000',
  'hex',
);

// The blank movie with a DoAction tag before its frame that pushes the text
// "lognal-e2e" and traces it, so Ruffle has a line of its own to log.
const TRACE_SWF = Buffer.from(
  '4657530a310000007800055f00000fa000001801004302ffffff1103960c00006c6f676e616c2d65326500260040000000',
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

// The repository leaves Ruffle out, so a run without it skips what needs a movie.
const hasRuffle = existsSync('dist/js/ruffle/ruffle.js');

const readMessages = (locale: string, namespace: string): Record<string, string> =>
  JSON.parse(
    readFileSync(join('src/renderer/public/locales', locale, `${namespace}.json`), 'utf8'),
  );

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

// Drags files from outside the window onto the middle of `target`, with the
// trusted input events an operating system drag produces, so the dropped files
// carry their real paths.
const dragFilesOnto = async (paths: string[], target: Locator) => {
  const cdp = await appWindow.context().newCDPSession(appWindow);
  const box = await target.boundingBox();

  if (!box) {
    throw new Error('Drop target is not on screen');
  }

  const point = { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
  const data = { items: [], files: paths, dragOperationsMask: 1 };

  for (const type of ['dragEnter', 'dragOver', 'drop'] as const) {
    await cdp.send('Input.dispatchDragEvent', { type, ...point, data });
  }

  await cdp.detach();
};

const openExplorer = async () => {
  if ((await windowRoute()) !== '/explorer') {
    await appWindow.getByRole('button', { name: 'Back' }).click();
  }

  await expect(appWindow.getByTestId('uiFileOpen')).toBeVisible();
};

// What the settings file holds, written as soon as a setting changes.
const readStoredConfig = () => JSON.parse(readFileSync(join(userDataDir, 'config.json'), 'utf8'));

const settingsDialog = () => appWindow.getByRole('dialog', { name: 'Settings' });

const openSettings = async (group = 'General') => {
  await appWindow.getByRole('button', { name: 'Settings' }).click();
  await settingsDialog().getByRole('button', { name: group, exact: true }).click();
};

const closeSettings = async () => {
  await appWindow.keyboard.press('Escape');
  await expect(settingsDialog()).toBeHidden();
};

// Opens a file the way the system does, with the app already running.
const playFile = (filePath: string) =>
  appElectron.evaluate(
    ({ BrowserWindow }, path) =>
      BrowserWindow.getAllWindows()[0].webContents.send('receiveOpenFile', path),
    filePath,
  );

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

test('Header buttons are named in the app language, and the about dialog opens from one', async () => {
  const menu = readMessages('en', 'menu');

  await expect(appWindow.getByRole('button', { name: menu.settings })).toBeVisible();
  await appWindow.getByRole('button', { name: menu['app-info'] }).click();

  const dialog = appWindow.getByRole('dialog', {
    name: readMessages('en', 'common')['about-title'],
  });

  await expect(dialog).toBeVisible();
  await appWindow.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('Settings dialog groups its options in a list beside them', async () => {
  const dialog = settingsDialog();

  await appWindow.getByRole('button', { name: 'Settings' }).click();

  await expect(dialog.getByText(readMessages('en', 'common')['settings-info'])).toBeVisible();
  await expect(dialog.getByRole('navigation', { name: 'Settings' }).getByRole('button')).toHaveText(
    ['General', 'Emulation', 'Advanced'],
  );
  await expect(dialog.getByRole('button', { name: 'General', exact: true })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(dialog.getByRole('heading', { name: 'Language' })).toBeVisible();
  await expect(dialog.getByRole('combobox', { name: 'Language' })).toHaveText('Auto Detect');

  await dialog.getByRole('button', { name: 'Emulation', exact: true }).click();

  // The emulation groups drop the "Player:" label the group now stands for.
  await expect(
    dialog.getByRole('heading', { name: 'Graphics Renderer', exact: true }),
  ).toBeVisible();
  await expect(dialog.getByRole('heading', { name: /^Player:/ })).toHaveCount(0);
  await expect(dialog.getByRole('heading', { name: 'Language' })).toHaveCount(0);

  await dialog.getByRole('button', { name: 'Advanced', exact: true }).click();

  await expect(dialog.getByRole('heading', { name: 'Reset app data' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Reset and restart the App' })).toBeVisible();

  await closeSettings();
});

test('A new profile starts on the default emulation options', async () => {
  const common = readMessages('en', 'common');
  const dialog = settingsDialog();
  const section = (key: string) => dialog.getByRole('region', { name: common[key] });

  await openSettings('Emulation');

  await expect(
    section('settings-title-6').getByRole('radio', { name: 'High (recommended)' }),
  ).toBeChecked();
  await expect(
    section('settings-scale-title').getByRole('radio', {
      name: 'Fit, keeping the aspect ratio (recommended)',
    }),
  ).toBeChecked();
  await expect(
    section('settings-letterbox-title').getByRole('radio', { name: 'Always' }),
  ).toBeChecked();
  await expect(dialog.getByRole('combobox', { name: 'Script time limit' })).toHaveText(
    '15 seconds (recommended)',
  );
  await expect(
    section('settings-title-8').getByRole('radio', { name: 'Canvas (experimental)' }),
  ).toBeVisible();
  await expect(
    section('settings-title-7').getByRole('radio', { name: 'Adobe Flash Player (recommended)' }),
  ).toBeChecked();

  await closeSettings();
});

test('Theme setting switches the page between dark and light', async () => {
  const html = appWindow.locator('html');
  const theme = settingsDialog().getByRole('group', { name: 'App theme settings' });

  await openSettings();

  await theme.getByRole('button', { name: 'Dark', exact: true }).click();
  await expect(html).toHaveAttribute('data-mp-scheme', 'dark');
  expect(readStoredConfig().theme).toBe('dark');

  await theme.getByRole('button', { name: 'Light', exact: true }).click();
  await expect(html).toHaveAttribute('data-mp-scheme', 'light');

  // A press on the chosen theme leaves it chosen.
  await theme.getByRole('button', { name: 'Light', exact: true }).click();
  await expect(theme.getByRole('button', { name: 'Light', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await theme.getByRole('button', { name: 'Automatic Detection' }).click();
  await expect.poll(() => readStoredConfig().theme).toBe('auto');

  await closeSettings();
});

test('Launching at system start sits above the window option on macOS and Windows', async () => {
  const dialog = settingsDialog();
  const autoLaunch = dialog.getByRole('checkbox', {
    name: 'Launch the app when the system starts',
  });
  const restoreBounds = dialog.getByRole('checkbox', {
    name: 'Remember the size and position of the last window when exiting the app',
  });

  await openSettings();
  await expect(restoreBounds).toBeChecked();

  // Electron has no login item on Linux, so the option is not offered there.
  if (process.platform === 'linux') {
    await expect(autoLaunch).toHaveCount(0);
  } else {
    await expect(autoLaunch).not.toBeChecked();
    expect((await autoLaunch.boundingBox())!.y).toBeLessThan(
      (await restoreBounds.boundingBox())!.y,
    );

    // End-to-end runs keep the login item in memory instead of in the system.
    await autoLaunch.click();
    await expect(autoLaunch).toBeChecked();
    await closeSettings();
    await openSettings();
    await expect(autoLaunch).toBeChecked();
    await autoLaunch.click();
    await expect(autoLaunch).not.toBeChecked();
  }

  await closeSettings();
});

test('Hardware acceleration leads the advanced options and asks for a restart', async () => {
  const dialog = settingsDialog();
  const acceleration = dialog.getByRole('checkbox', { name: 'Use hardware acceleration' });
  const restartNotice = dialog.getByText(
    'You must restart the app for the changes to take effect!',
  );

  await openSettings('Advanced');

  await expect(dialog.locator('.app-settings__panel').getByRole('heading').first()).toHaveText(
    'Hardware acceleration',
  );
  await expect(acceleration).toBeChecked();
  await expect(restartNotice).toBeHidden();

  await acceleration.click();

  await expect(restartNotice).toBeVisible();
  await expect.poll(() => readStoredConfig().hardwareAcceleration).toBe(false);

  // Back to the value this run started with, so nothing waits for a restart.
  await acceleration.click();

  await expect(restartNotice).toBeHidden();
  await expect.poll(() => readStoredConfig().hardwareAcceleration).toBe(true);

  await closeSettings();
});

test('Player plays a SWF file and reports its metadata', async () => {
  test.skip(!hasRuffle, 'Ruffle is not in dist/js/ruffle');

  const swfPath = join(fixturesDir, 'Blank Movie.swf');

  writeFileSync(swfPath, BLANK_SWF);
  await playFile(swfPath);

  await expect(appWindow).toHaveTitle('Blank Movie.swf - Flare Flash Player');
  await expect(appWindow.getByRole('button', { name: 'Restart' })).toBeVisible();
  await expect(appWindow.getByRole('button', { name: 'Volume' })).toBeVisible();
  // Ruffle ignores an option it does not know by name, so this checks the
  // autoplay option reached it.
  await expect
    .poll(() =>
      appWindow.evaluate(() => (document.getElementById('player') as any)?.loadedConfig?.autoplay),
    )
    .toBe('on');
  await expect(appWindow.getByRole('button', { name: 'Pause' })).toBeVisible();

  await appWindow.getByRole('button', { name: 'Pause' }).click();
  await expect(appWindow.getByRole('button', { name: 'Play' })).toBeVisible();
  await appWindow.getByRole('button', { name: 'Play' }).click();
  await expect(appWindow.getByRole('button', { name: 'Pause' })).toBeVisible();

  await appWindow.getByRole('button', { name: 'File information' }).click();

  const info = appWindow.getByRole('dialog');

  await expect(info.getByText('550', { exact: true })).toBeVisible();
  await expect(info.getByText('400', { exact: true })).toBeVisible();
  await info.getByRole('button', { name: 'Close' }).click();
  await expect(info).toBeHidden();
});

test('The game waits under a header dialog and goes on when it closes', async () => {
  test.skip(!hasRuffle, 'Ruffle is not in dist/js/ruffle');

  const header = appWindow.getByRole('banner');
  const controls = appWindow.locator('.app-player__controller');
  const isMoviePlaying = () =>
    appWindow.evaluate(() => (document.getElementById('player') as any)?.isPlaying);
  const closeDialog = async (name: string) => {
    // The file information dialog closes from its button only.
    if (name === 'File information') {
      await appWindow.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
    } else {
      await appWindow.keyboard.press('Escape');
    }

    await expect(appWindow.getByRole('dialog')).toBeHidden();
  };

  await expect.poll(isMoviePlaying).toBe(true);

  for (const name of ['Settings', 'About App...', 'File information']) {
    await header.getByRole('button', { name }).click();
    await expect(appWindow.getByRole('dialog')).toBeVisible();
    await expect.poll(isMoviePlaying).toBe(false);

    await closeDialog(name);

    await expect.poll(isMoviePlaying).toBe(true);
    await expect(controls.getByRole('button', { name: 'Pause' })).toBeVisible();
  }

  // A game the reader paused stays paused once the dialog closes.
  await controls.getByRole('button', { name: 'Pause' }).click();
  await expect(controls.getByRole('button', { name: 'Play' })).toBeVisible();

  await header.getByRole('button', { name: 'About App...' }).click();
  await closeDialog('About App...');

  expect(await isMoviePlaying()).toBe(false);

  await controls.getByRole('button', { name: 'Play' }).click();
  await expect.poll(isMoviePlaying).toBe(true);
});

test('Volume opens from the speaker button, and unmuting brings its level back', async () => {
  test.skip(!hasRuffle, 'Ruffle is not in dist/js/ruffle');

  const slider = appWindow.getByRole('slider', { name: 'Volume' });
  const mute = appWindow.getByRole('checkbox', { name: 'Mute' });
  const movieVolume = () =>
    appWindow.evaluate(() => (document.getElementById('player') as any)?.volume);

  await appWindow.getByRole('button', { name: 'Volume' }).click();
  await expect(slider).toHaveValue('100');

  await slider.focus();
  await appWindow.keyboard.press('PageDown');
  await expect(slider).toHaveValue('90');
  await expect.poll(movieVolume).toBeCloseTo(0.9);
  await expect.poll(() => readStoredConfig().playerVolume).toBe(90);

  // The slider keeps its level while muted, and unmuting goes back to it.
  await mute.click();
  await expect.poll(movieVolume).toBe(0);
  await expect(slider).toBeDisabled();
  await expect(slider).toHaveValue('90');
  await expect.poll(() => readStoredConfig().playerMuted).toBe(true);

  await mute.click();
  await expect.poll(movieVolume).toBeCloseTo(0.9);
  await expect(slider).toBeEnabled();
  await expect.poll(() => readStoredConfig().playerMuted).toBe(false);

  await slider.focus();
  await appWindow.keyboard.press('PageUp');
  await expect(slider).toHaveValue('100');
  await appWindow.keyboard.press('Escape');
  await expect(slider).toBeHidden();
});

test('Virtual mouse clicks the movie where its cursor is and keeps the keyboard on the movie', async () => {
  test.skip(!hasRuffle, 'Ruffle is not in dist/js/ruffle');

  // Matches `SYNTHETIC_POINTER_ID` in `PlayerVirtualMousePad`.
  const padPointerId = 0x7ffffff0;
  const stage = appWindow.locator('.app-player__stage');
  const toggle = appWindow.getByRole('button', { name: 'Virtual mouse' });
  const pad = appWindow.locator('.virtual-mouse__panel');
  const leftButton = pad.locator('.virtual-mouse__click').first();
  const padPresses = () =>
    appWindow.evaluate(
      (pointerId) =>
        (window as any).e2ePadEvents.filter(
          (event) => event.pointerId === pointerId && event.type === 'pointerdown',
        ),
      padPointerId,
    );

  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(pad).toBeVisible();
  await expect(appWindow.locator('.virtual-mouse__cursor')).toBeVisible();

  // A real click on the movie gives it the keyboard and moves the cursor there.
  await stage.click({ position: { x: 100, y: 80 } });

  await expect.poll(() => appWindow.evaluate(() => document.activeElement?.id)).toBe('player');
  const expected = await appWindow.evaluate(() => {
    const player = document.getElementById('player') as any;
    const canvases = player.shadowRoot.querySelectorAll('canvas');
    const canvas = canvases[canvases.length - 1];
    const stageRect = document.querySelector('.app-player__stage')!.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    (window as any).e2ePadEvents = [];

    for (const type of ['pointerdown', 'pointerup']) {
      canvas.addEventListener(type, (event: PointerEvent) => {
        (window as any).e2ePadEvents.push({
          type,
          pointerId: event.pointerId,
          button: event.button,
          x: event.offsetX,
          y: event.offsetY,
        });
      });
    }

    return { x: stageRect.left + 100 - canvasRect.left, y: stageRect.top + 80 - canvasRect.top };
  });

  await leftButton.click();

  // A quick press is still held long enough for the movie to see it.
  await expect
    .poll(() => appWindow.evaluate(() => (window as any).e2ePadEvents.map((event) => event.type)))
    .toEqual(['pointerdown', 'pointerup']);

  const [press] = await padPresses();

  expect(press.button).toBe(0);
  expect(press.x).toBeCloseTo(expected.x, 0);
  expect(press.y).toBeCloseTo(expected.y, 0);
  expect(await appWindow.evaluate(() => document.activeElement?.id)).toBe('player');

  // Turbo turns one long press into a run of clicks.
  await pad.getByRole('button', { name: 'TURBO' }).click();
  await expect(pad.getByRole('button', { name: 'TURBO' })).toHaveAttribute('aria-pressed', 'true');
  await leftButton.hover();
  await appWindow.mouse.down();
  await appWindow.waitForTimeout(500);
  await appWindow.mouse.up();

  expect((await padPresses()).length).toBeGreaterThanOrEqual(4);

  await pad.getByRole('button', { name: 'Close' }).click();
  await expect(pad).toHaveCount(0);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});

// What Ruffle loaded the movie on the player screen with.
const loadedConfig = () =>
  appWindow.evaluate(() => {
    const config = (document.getElementById('player') as any)?.loadedConfig;

    return {
      scale: config?.scale,
      forceScale: config?.forceScale,
      letterbox: config?.letterbox,
      quality: config?.quality,
      allowFullscreen: config?.allowFullscreen,
      maxExecutionDuration: config?.maxExecutionDuration,
      backgroundExecutionMode: config?.backgroundExecutionMode,
      contextMenu: config?.contextMenu,
      deviceFontRenderer: config?.deviceFontRenderer,
    };
  });

const movieWidth = () =>
  appWindow.evaluate(() => (document.querySelector('#player') as any)?.metadata?.width);

test('View settings changed during play apply to the running movie', async () => {
  test.skip(!hasRuffle, 'Ruffle is not in dist/js/ruffle');

  const menu = readMessages('en', 'menu');
  const common = readMessages('en', 'common');
  const dialog = settingsDialog();
  const option = (key: string) => dialog.getByRole('checkbox', { name: menu[key] });
  const windowSize = () =>
    appElectron.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getSize());
  const swfPath = join(fixturesDir, 'View Movie.swf');

  writeFileSync(swfPath, BLANK_SWF);
  await playFile(swfPath);
  // Width and height come from the movie itself, so they prove Ruffle read it.
  await expect.poll(movieWidth).toBe(550);

  const sizeBefore = await windowSize();

  await openSettings('Emulation');

  // Most options reach the playing movie only after a restart, and the dialog
  // names the button that does it.
  await expect(
    dialog.getByText(common['settings-info-playing'].replace('{{restart}}', menu.replay)),
  ).toBeVisible();

  // The open dialog hides the rest of the page from the accessibility tree, so
  // the parts behind it are found by their class.
  await option('show-player-controller').click();
  await expect(appWindow.locator('.app-player__controller')).toHaveCount(0);
  await option('show-player-controller').click();
  await expect(appWindow.locator('.app-player__controller')).toHaveCount(1);

  await option('show-player-version-select').click();
  await expect(
    appWindow.locator('.app-header').getByRole('combobox', { includeHidden: true }),
  ).toHaveCount(1);
  await option('show-player-version-select').click();
  await expect(
    appWindow.locator('.app-header').getByRole('combobox', { includeHidden: true }),
  ).toHaveCount(0);

  // The dialog stays open while the header it was opened from goes away.
  await option('hide-header').click();
  await expect(appWindow.locator('.app-header')).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await option('hide-header').click();
  await expect(appWindow.locator('.app-header')).toHaveCount(1);

  // The window takes the movie's 550x400 stage as soon as the option is on.
  await option('adjust-original-size').click();
  await expect.poll(windowSize).toEqual([550, 400]);
  await option('adjust-original-size').click();
  await appElectron.evaluate(
    ({ BrowserWindow }, [width, height]) => BrowserWindow.getAllWindows()[0].setSize(width, height),
    sizeBefore,
  );

  // Ruffle reads these two each time it needs them, so the movie takes them at once.
  await option('hide-context').click();
  await dialog.getByRole('checkbox', { name: menu['pause-in-background'] }).click();
  await expect.poll(async () => (await loadedConfig()).contextMenu).toBe('off');
  await expect.poll(async () => (await loadedConfig()).backgroundExecutionMode).toBe('none');
  await option('hide-context').click();
  await dialog.getByRole('checkbox', { name: menu['pause-in-background'] }).click();
  await expect.poll(async () => (await loadedConfig()).contextMenu).toBe('on');
  await expect.poll(async () => (await loadedConfig()).backgroundExecutionMode).toBe('mainThread');

  await closeSettings();
});

test('Emulation options reach Ruffle when the movie loads again', async () => {
  test.skip(!hasRuffle, 'Ruffle is not in dist/js/ruffle');

  const menu = readMessages('en', 'menu');
  const common = readMessages('en', 'common');
  const dialog = settingsDialog();
  const section = (key: string) => dialog.getByRole('region', { name: common[key] });
  const scriptLimit = section('settings-script-limit-title').getByRole('combobox');

  await openSettings('Emulation');

  await section('settings-scale-title')
    .getByRole('radio', { name: menu['scale-exact-fit'] })
    .click();
  await dialog.getByRole('checkbox', { name: menu['force-scale'] }).click();
  await section('settings-letterbox-title')
    .getByRole('radio', { name: menu['letterbox-fullscreen'] })
    .click();
  await section('settings-title-6').getByRole('radio', { name: '16x16' }).click();
  await section('settings-title-8').getByRole('radio', { name: 'Canvas (experimental)' }).click();
  await dialog.getByRole('checkbox', { name: menu['allow-fullscreen'] }).click();
  await scriptLimit.click();
  await appWindow.getByRole('option', { name: '60 seconds' }).click();

  await expect
    .poll(() => {
      const config = readStoredConfig();

      return [
        config.scale,
        config.forceScale,
        config.letterboxMode,
        config.quality,
        config.deviceFontRenderer,
        config.allowFullscreen,
        config.maxExecutionDuration,
      ];
    })
    .toEqual(['exactFit', true, 'fullscreen', '16x16', 'canvas', true, 60]);

  await closeSettings();
  await appWindow.getByRole('button', { name: 'Restart' }).click();

  await expect.poll(loadedConfig).toMatchObject({
    scale: 'exactFit',
    forceScale: true,
    letterbox: 'fullscreen',
    quality: '16x16',
    deviceFontRenderer: 'canvas',
    allowFullscreen: true,
    maxExecutionDuration: 60,
  });

  // Back to the defaults for the tests that follow.
  await openSettings('Emulation');
  await section('settings-scale-title').getByRole('radio').first().click();
  await dialog.getByRole('checkbox', { name: menu['force-scale'] }).click();
  await section('settings-letterbox-title')
    .getByRole('radio', { name: menu['letterbox-on'] })
    .click();
  await section('settings-title-6').getByRole('radio', { name: menu['quality-high'] }).click();
  await section('settings-title-8').getByRole('radio', { name: 'Embedded' }).click();
  await dialog.getByRole('checkbox', { name: menu['allow-fullscreen'] }).click();
  await scriptLimit.click();
  await appWindow.getByRole('option', { name: '15 seconds (recommended)' }).click();
  await closeSettings();

  await expect
    .poll(() => {
      const config = readStoredConfig();

      return [config.scale, config.letterboxMode, config.quality, config.maxExecutionDuration];
    })
    .toEqual(['showAll', 'on', 'high', 15]);
});

test('The debug log shows what Ruffle writes beside the game and leaves the app out', async () => {
  test.skip(!hasRuffle, 'Ruffle is not in dist/js/ruffle');

  const common = readMessages('en', 'common');
  const menu = readMessages('en', 'menu');
  const dialog = settingsDialog();
  const levels = dialog.getByRole('group', { name: common['settings-debug-log-title'] });
  const log = appWindow.getByRole('region', { name: menu['debug-log'] });
  const entries = log.getByRole('list', { name: 'Visible log entries' });
  const swfPath = join(fixturesDir, 'Trace Movie.swf');
  const loadedLogLevel = () =>
    appWindow.evaluate(() => (document.getElementById('player') as any)?.loadedConfig?.logLevel);
  const setLevel = async (name: string) => {
    await openSettings('Advanced');
    await levels.getByRole('button', { name, exact: true }).click();
    await closeSettings();
  };

  // The log stays closed until a level is chosen.
  await expect(appWindow.locator('.app-player__stage')).toBeVisible();
  await expect(log).toHaveCount(0);

  await setLevel('Info');
  await expect.poll(() => readStoredConfig().debugLogLevel).toBe('info');

  writeFileSync(swfPath, TRACE_SWF);
  await playFile(swfPath);

  await expect(log).toBeVisible();
  await expect.poll(loadedLogLevel).toBe('info');
  await expect(entries).toContainText('lognal-e2e');

  // A script served from Ruffle's folder stands in for Ruffle, so its line marks
  // the point by which the app's message would have arrived.
  await appWindow.evaluate(() => {
    console.error('app-message-e2e');
    (0, eval)("console.log('core-message-e2e')\n//# sourceURL=http://localhost/js/ruffle/e2e.js");
  });

  await expect(entries).toContainText('core-message-e2e');
  await expect(entries).not.toContainText('app-message-e2e');

  // Turned off, the log closes when the movie starts again, and the movie keeps
  // its place on the screen.
  await setLevel(menu['debug-log-off']);
  await appWindow.getByRole('button', { name: 'Restart' }).click();

  await expect(log).toHaveCount(0);
  await expect.poll(loadedLogLevel).toBe('error');
  await expect(appWindow.locator('.app-player__stage #player')).toBeVisible();
  await expect.poll(movieWidth).toBe(550);
});

test('A confirmation reads its question as body text', async () => {
  await appWindow.getByRole('button', { name: 'Back' }).click();
  await openSettings('Advanced');
  await settingsDialog().getByRole('button', { name: 'Manage Emulator Save Data' }).click();
  await appWindow.getByRole('button', { name: 'Reset All Data' }).click();

  const confirm = appWindow.getByRole('dialog', {
    description: readMessages('en', 'notice').confirm,
  });

  await expect(confirm).toBeVisible();

  const fontSize = await confirm
    .getByText(readMessages('en', 'notice').confirm)
    .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));

  expect(fontSize).toBeGreaterThanOrEqual(15);

  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(confirm).toBeHidden();
  await appWindow.getByRole('button', { name: 'Close' }).last().click();
  await closeSettings();
});

test('Dropping a SWF file from outside plays it and remembers its path', async () => {
  test.skip(!hasRuffle, 'Ruffle is not in dist/js/ruffle');

  const swfPath = join(fixturesDir, 'Dropped Movie.swf');

  writeFileSync(swfPath, BLANK_SWF);
  await openExplorer();
  await dragFilesOnto([swfPath], appWindow.getByTestId('uiFileOpen'));

  await expect(appWindow.locator('.app-player__stage')).toBeVisible();
  await expect(appWindow).toHaveTitle('Dropped Movie.swf - Flare Flash Player');

  // The recent files list shows the path Electron resolved for the dropped file.
  await openExplorer();
  await expect(appWindow.getByRole('button', { name: swfPath })).toBeVisible();
});

test('Dropping several SWF files plays the first one', async () => {
  test.skip(!hasRuffle, 'Ruffle is not in dist/js/ruffle');

  const first = join(fixturesDir, 'First.swf');
  const second = join(fixturesDir, 'Second.swf');

  writeFileSync(first, BLANK_SWF);
  writeFileSync(second, BLANK_SWF);
  await openExplorer();
  await dragFilesOnto([first, second], appWindow.getByTestId('uiFileOpen'));

  await expect(appWindow).toHaveTitle('First.swf - Flare Flash Player');
  await openExplorer();
});

test('Dropping a file of another type shows the format error', async () => {
  const textPath = join(fixturesDir, 'notes.txt');

  writeFileSync(textPath, 'not a movie');
  await openExplorer();
  await dragFilesOnto([textPath], appWindow.getByTestId('uiFileOpen'));

  await expect(appWindow.getByText(readMessages('en', 'notice')['wrong-file-type'])).toBeVisible();
  await expect(appWindow.getByTestId('uiFileOpen')).toBeVisible();
});

test('Clicking the drop zone opens the file dialog for one SWF file', async () => {
  test.skip(!hasRuffle, 'Ruffle is not in dist/js/ruffle');

  const swfPath = join(fixturesDir, 'Chosen Movie.swf');

  writeFileSync(swfPath, BLANK_SWF);

  // Playwright answers the dialog itself, so no system dialog appears.
  const fileChooserPromise = appWindow.waitForEvent('filechooser');

  await appWindow.getByTestId('uiFileOpen').getByRole('button').first().click();

  const fileChooser = await fileChooserPromise;

  expect(fileChooser.isMultiple()).toBe(false);
  await fileChooser.setFiles(swfPath);

  await expect(appWindow).toHaveTitle('Chosen Movie.swf - Flare Flash Player');
  await openExplorer();
});

test('Advanced launch settings reach a file started from the explorer, and not one opened from the system', async () => {
  test.skip(!hasRuffle, 'Ruffle is not in dist/js/ruffle');

  const launch = appWindow.getByRole('region', { name: 'Advanced launch settings' });
  const strictMode = launch.getByRole('checkbox', { name: /^Strict mode/ });
  const restore = launch.getByRole('button', { name: 'Restore defaults' });
  const swfPath = join(fixturesDir, 'Launch Movie.swf');
  const systemPath = join(fixturesDir, 'System Movie.swf');
  const launchConfig = () =>
    appWindow.evaluate(() => {
      const config = (document.getElementById('player') as any)?.loadedConfig;

      return {
        allowScriptAccess: config?.allowScriptAccess,
        allowNetworking: config?.allowNetworking,
        openUrlMode: config?.openUrlMode,
        frameRate: config?.frameRate,
        parameters: config?.parameters,
        playerVersion: config?.playerVersion,
      };
    });
  const applied = {
    allowScriptAccess: false,
    allowNetworking: 'none',
    openUrlMode: 'deny',
    frameRate: 30,
    parameters: 'level=3&debug=1',
    playerVersion: 9,
  };

  writeFileSync(swfPath, BLANK_SWF);
  writeFileSync(systemPath, BLANK_SWF);
  await openExplorer();
  await expect(restore).toBeDisabled();

  await strictMode.click();
  await launch.getByRole('combobox', { name: 'Player version' }).click();
  await appWindow.getByRole('option', { name: '9', exact: true }).click();
  await launch.getByLabel('Frame rate').fill('30');
  await launch.getByLabel('Frame rate').press('Enter');
  await launch.getByRole('textbox', { name: 'Parameters' }).fill('level=3&debug=1');
  await expect(restore).toBeEnabled();

  // A drop takes the options.
  await dragFilesOnto([swfPath], appWindow.getByTestId('uiFileOpen'));
  await expect(appWindow).toHaveTitle('Launch Movie.swf - Flare Flash Player');
  await expect.poll(launchConfig).toEqual(applied);

  // They stay for the next file the explorer starts, from the recent files too.
  await openExplorer();
  await expect(strictMode).toBeChecked();
  await appWindow.getByRole('button', { name: /^Launch Movie\.swf/ }).click();
  await expect(appWindow).toHaveTitle('Launch Movie.swf - Flare Flash Player');
  await expect.poll(launchConfig).toEqual(applied);

  // A file opened from the system plays without them.
  await playFile(systemPath);
  await expect(appWindow).toHaveTitle('System Movie.swf - Flare Flash Player');
  await expect.poll(launchConfig).toEqual({
    allowScriptAccess: true,
    allowNetworking: 'all',
    openUrlMode: 'confirm',
    frameRate: null,
    parameters: {},
    playerVersion: null,
  });

  await openExplorer();
  await restore.click();
  await expect(strictMode).not.toBeChecked();
  await expect(launch.getByRole('textbox', { name: 'Parameters' })).toHaveValue('');
  await expect(restore).toBeDisabled();
});

test('Recent files lead with the file name and can be cleared', async () => {
  const list = appWindow.getByRole('list', { name: 'Recent Files' });

  await openExplorer();
  // The file opened from the system last leads the list, its name above its path.
  await expect(list.getByRole('button').first()).toHaveAccessibleName(
    `System Movie.swf ${join(fixturesDir, 'System Movie.swf')}`,
  );

  await appWindow.getByRole('button', { name: 'Clear recent files' }).click();
  await expect(list).toHaveCount(0);
  await expect(appWindow.getByText(readMessages('en', 'notice')['no-recent-files'])).toBeVisible();
  await expect.poll(() => readStoredConfig().recentFiles).toEqual([]);
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
  test.skip(!hasRuffle, 'Ruffle is not in dist/js/ruffle');

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
  await playFile(swfPath);

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
