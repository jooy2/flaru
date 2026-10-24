import {
  app,
  BrowserWindow,
  protocol,
  ipcMain,
  dialog,
  Menu,
  systemPreferences,
  shell,
} from 'electron';
import http from 'http';
import handler from 'serve-handler';
import { join, dirname } from 'path';
import ElectronStore from 'electron-store';
import * as electronLocalShortcut from 'electron-localshortcut';
import { platform } from 'os';
import { getFileName, isExistingPath } from 'qsu/node';
import pkg from '../../package.json';
import mainStoreSchema from './schema';
import { isSameDocument, isWebUrl } from './utils';

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };

const getPlatform = (): string => {
  switch (platform()) {
    case 'win32':
      return 'Windows';
    case 'darwin':
      return 'macOS';
    case 'linux':
    case 'aix':
    case 'sunos':
    case 'netbsd':
    case 'openbsd':
    case 'freebsd':
    case 'cygwin':
    case 'android':
      return 'Linux';
    default:
      return 'Unknown';
  }
};

const CURRENT_OS = getPlatform();
const IS_E2E = process.env.E2E === 'yes';
const MAX_RECENT_FILES = 10;
const DEFAULT_WINDOW_ATTR = {
  minWidth: 100,
  minHeight: 100,
  width: 1300,
  height: 800,
};

// End-to-end runs get their own settings, recent files and local storage, so a
// test that changes an option never touches the developer's own app data.
if (IS_E2E && process.env.E2E_USER_DATA_DIR) {
  app.setPath('userData', process.env.E2E_USER_DATA_DIR);
}

global.APP_NAME = pkg.displayName;
global.APP_VERSION_NAME = pkg.version;
global.APP_VERSION_CODE = pkg.versionCode;
global.APP_VERSION_DATE = pkg.versionDate;
global.APP_AUTHOR = pkg.author;
global.APP_RUFFLE_VERSION_DATE = pkg.ruffleVersionDate;
global.ENV_IS_DEV = IS_E2E ? false : !app.isPackaged;
global.ENV_OS = CURRENT_OS;
global.ENV_IS_WINDOWS = CURRENT_OS === 'Windows';
global.ENV_IS_MAC = CURRENT_OS === 'macOS';
global.WILL_OPEN_FILE_PATH = null;

const schema = mainStoreSchema as DeepWriteable<typeof mainStoreSchema>;
const store = new ElectronStore({ schema });
const userAgent = `Electron ${app.getVersion()}, ${pkg.displayName} ${pkg.version}`;
let win;
let staticServer: http.Server | null = null;

const openFromExplorer = (argv, argvIndex = 1) => {
  if (
    global.ENV_IS_WINDOWS &&
    argv &&
    argv.length >= argvIndex &&
    argv[argvIndex]?.indexOf('.swf') !== -1
  ) {
    win.webContents.send('receiveNextRenderer', argv[argvIndex]);
    win.webContents.send('receiveOpenFile', argv[argvIndex]);
  } else {
    win.webContents.send('receiveNextRenderer', global.WILL_OPEN_FILE_PATH);
  }
};

const getWindowBounds = () => {
  const defaultBounds = {
    width: DEFAULT_WINDOW_ATTR.width,
    height: DEFAULT_WINDOW_ATTR.height,
  };

  if (store.get('restoreWindowBounds')) {
    return (store.get('windowBounds') as object) || defaultBounds;
  }

  return defaultBounds;
};

const createWindow = () => {
  win = new BrowserWindow({
    ...getWindowBounds(),
    minWidth: DEFAULT_WINDOW_ATTR.minWidth,
    minHeight: DEFAULT_WINDOW_ATTR.minHeight,
    // End-to-end runs drive the window without ever showing it, so a test run
    // does not take focus from whatever else is open on the machine.
    show: !IS_E2E,
    webPreferences: {
      spellcheck: false,
      // To allow load ruffle content
      webSecurity: false,
      devTools: global.ENV_IS_DEV,
      contextIsolation: true,
      nodeIntegration: false,
      // Chromium treats a hidden window as a background page and slows its
      // timers and animation frames, which the tests would otherwise wait on.
      backgroundThrottling: !IS_E2E,
      preload: join(__dirname, '../preload/index.js'),
    },
  });

  win.setMenuBarVisibility(false);

  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: global.APP_NAME,
        submenu: [
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          {
            label: `Quit ${global.APP_NAME}`,
            role: 'quit',
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'delete' },
          { role: 'selectAll' },
        ],
      },
      {
        label: 'View',
        submenu: [{ role: 'togglefullscreen' }],
      },
      {
        label: 'Window',
        submenu: [{ role: 'minimize' }, { type: 'separator' }, { role: 'front' }],
      },
    ]),
  );

  if (global.ENV_IS_MAC) {
    systemPreferences.setUserDefault('NSDisabledDictationMenuItem', 'boolean', true);
    systemPreferences.setUserDefault('NSDisabledCharacterPaletteMenuItem', 'boolean', true);
  }

  if (global.ENV_IS_DEV) {
    win
      .loadURL('http://localhost:5173', { userAgent })
      .catch((e) => {
        console.log(e);
      })
      .then(() => {
        win.webContents.openDevTools();
      });
  } else {
    win.loadFile(join(__dirname, '../index.html'), { userAgent }).catch((e) => {
      console.log(e);
    });
  }

  win.on('close', () => {
    store.set({
      windowBounds: win ? win.getBounds() : null,
    });
  });

  win.webContents.once('dom-ready', () => {
    const { argv } = process;

    electronLocalShortcut.register(
      win,
      ['F12', 'CommandOrControl+R', 'CommandOrControl+Shift+R'],
      () => {},
    );

    electronLocalShortcut.register(win, ['Alt+Enter'], () => {
      win.setFullScreen(!win.isFullScreen());
    });

    electronLocalShortcut.register(win, 'F5', () => {
      win.webContents.send('receiveResumeToExplorer');
    });

    openFromExplorer(argv, 1);
  });

  // A web page asked for goes to the system browser. Any other address, such as
  // a local file, is not opened at all.
  const openInBrowser = (url: string) => {
    if (isWebUrl(url)) {
      shell.openExternal(url).catch(() => null);
    }
  };

  // The app never opens a second window of its own: one would take this
  // window's preload and its lifted web security, and hand them to whatever page
  // a movie points at.
  win.webContents.setWindowOpenHandler(({ url }) => {
    openInBrowser(url);

    return { action: 'deny' };
  });

  // Nor does this window leave the app's page. A movie that asks for an address
  // in its own window, as `getURL` with no target or with `_self`, `_top` or
  // `_parent` does, would otherwise replace the app with that page and give it
  // the same preload. A file dropped outside the drop zone would do the same.
  // The app's page loading itself again is let through.
  win.webContents.on('will-navigate', (details) => {
    if (isSameDocument(details.url, win.webContents.getURL())) {
      return;
    }

    details.preventDefault();
    openInBrowser(details.url);
  });
};

const restartApp = () => {
  app.relaunch();
  app.exit();
};

const closeStaticServerWhenIsRunning = async () => {
  try {
    if (staticServer !== null) {
      await staticServer.close();
    }
  } catch {
    /* do nothing */
  }
};

const tryConnectStaticServer = async (port: number, baseUrl: string): Promise<http.Server | null> =>
  new Promise((resolve) => {
    const server: http.Server = http.createServer(async (request, response) => {
      const res = await handler(request, response, {
        public: baseUrl,
      });
      return res;
    });

    server.once('error', () => {
      try {
        server.close();
      } catch {
        /* do nothing */
      }
      resolve(null);
    });

    server.listen(port, () => {
      resolve(server);
    });
  });

const startStaticServer = async (baseUrl: string): Promise<number | null> =>
  new Promise((resolve) => {
    (async () => {
      await closeStaticServerWhenIsRunning();

      const availPorts = [8080, 3000, 3010, 3011, 3012, 3013, 3014, 3015, 3016, 3017, 3018, 3019];

      for (let i = 0; i < availPorts.length; i += 1) {
        try {
          const server: http.Server | null = await tryConnectStaticServer(availPorts[i], baseUrl);

          if (server) {
            staticServer = server;
            resolve(availPorts[i]);
            return;
          }
        } catch {
          /* do nothing */
        }
      }

      resolve(null);
    })();
  });

app.on('open-file', (event, pathParam) => {
  event.preventDefault();
  if (win?.webContents) {
    // Requests invoked while the app is not running
    win.webContents.send('receiveOpenFile', pathParam);
  } else {
    global.WILL_OPEN_FILE_PATH = pathParam;
  }
});

app.on('ready', () => {
  if (IS_E2E && global.ENV_IS_MAC) {
    // With the window hidden, the Dock icon is the only part of the app that
    // would still appear on screen.
    app.dock?.hide();
  }

  protocol.registerFileProtocol('file', (request, callback) => {
    const pathname = decodeURI(request.url.replace('file:///', ''));
    callback(pathname);
  });

  createWindow();
});

app.on('window-all-closed', () => {
  closeStaticServerWhenIsRunning().then(() => {
    app.quit();
  });
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('mainLoaded', async () => {
  openFromExplorer(process?.argv, 1);
});

ipcMain.on('getAppConfig', () => {
  win.webContents.send('receiveAppConfig', store.store);
});

ipcMain.on('getRecentFiles', () => {
  const recentFiles: any = store.get('recentFiles');
  win.webContents.send('receiveRecentFiles', recentFiles.reverse());
});

ipcMain.on('setAppConfig', (event, args) => {
  store.set(args);
});

ipcMain.on('resetAppConfig', () => {
  store.clear();
  restartApp();
});

ipcMain.on('appendRecentFiles', (event, file) => {
  try {
    if (!file || file.length < 1) {
      return;
    }

    const recentFiles: any = store.get('recentFiles');
    const fileIndex = recentFiles.findIndex((x) => x === file);

    if (fileIndex !== -1) {
      recentFiles.splice(fileIndex, 1);
    }

    recentFiles.push(file);

    if (recentFiles.length > MAX_RECENT_FILES) {
      recentFiles.shift();
    }

    store.set({ recentFiles });
  } catch {
    store.set({
      recentFiles: [],
    });
  }
});

ipcMain.on('checkFileExist', async (event, args) => {
  win.webContents.send('receiveFileExist', {
    name: args.name,
    path: args.path,
    exist: await isExistingPath(args.path),
  });
});

ipcMain.on('resizeWindow', async (event, args) => {
  if (
    args &&
    args.width &&
    args.height &&
    args.width > DEFAULT_WINDOW_ATTR.minWidth &&
    args.height > DEFAULT_WINDOW_ATTR.minHeight
  ) {
    win.setSize(args.width, args.height, true);
  }
});

ipcMain.on('removeRecentFile', async (event, args) => {
  const response = await dialog.showMessageBox(win, {
    type: 'info',
    title: args.title,
    message: args.message,
  });

  if (response && response.response < 2) {
    const recentFiles: any = store.get('recentFiles');
    const fileIndex = recentFiles.findIndex((x) => x === args.path);

    if (fileIndex !== -1) {
      recentFiles.splice(fileIndex, 1);
    }

    store.set({ recentFiles });
    win.webContents.send('receiveRecentFiles', recentFiles.reverse());
  }
});

ipcMain.on('removeAllRecentFile', async () => {
  store.set({ recentFiles: [] });
  win.webContents.send('receiveRecentFiles', []);
});

ipcMain.on('openExternalLink', async (event, url) => {
  // Only web pages: the renderer has no reason to hand any other scheme to the
  // system.
  if (isWebUrl(url)) {
    await shell.openExternal(url);
  }
});

ipcMain.handle('startStaticServer', async (event, data) => {
  const port = await startStaticServer(data);
  return port;
});

ipcMain.handle('getFileNameFromPath', (event, filePath: string, withExtension?: boolean) =>
  filePath ? getFileName(filePath, withExtension) : '',
);

ipcMain.handle('getDirnameFromPath', (event, filePath: string) => dirname(filePath));

ipcMain.handle('getGlobalValues', () => ({
  APP_NAME: global.APP_NAME,
  APP_VERSION_NAME: global.APP_VERSION_NAME,
  APP_VERSION_CODE: global.APP_VERSION_CODE,
  APP_VERSION_DATE: global.APP_VERSION_DATE,
  APP_AUTHOR: global.APP_AUTHOR,
  APP_RUFFLE_VERSION_DATE: global.APP_RUFFLE_VERSION_DATE,
  ENV_IS_DEV: global.ENV_IS_DEV,
  ENV_OS: global.ENV_OS,
  ENV_IS_WINDOWS: global.ENV_IS_WINDOWS,
  ENV_IS_MAC: global.ENV_IS_MAC,
  WILL_OPEN_FILE_PATH: global.WILL_OPEN_FILE_PATH,
}));
