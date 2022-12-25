import { app, BrowserWindow, protocol, ipcMain, dialog, Menu, systemPreferences } from 'electron';
import { join } from 'path';
import ElectronStore from 'electron-store';
import * as electronLocalShortcut from 'electron-localshortcut';
import * as electronRemote from '@electron/remote/main';
import { promises } from 'fs';
import { getPlatform } from 'qsu';
import pkg from '../../package.json';
import mainStoreSchema from './schema';

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };

const fileExists = async (p) => !!(await promises.stat(p).catch(() => false));

const CURRENT_OS = getPlatform();
const MAX_RECENT_FILES = 10;
const DEFAULT_WINDOW_ATTR = {
  minWidth: 100,
  minHeight: 100,
  width: 1300,
  height: 800,
};

global.APP_NAME = pkg.displayName;
global.APP_VERSION_NAME = pkg.version;
global.APP_VERSION_CODE = pkg.versionCode;
global.APP_VERSION_DATE = pkg.versionDate;
global.APP_AUTHOR = pkg.author;
global.APP_RUFFLE_VERSION_DATE = pkg.ruffleVersionDate;
global.ENV_IS_DEV = !app.isPackaged;
global.ENV_OS = CURRENT_OS;
global.ENV_IS_WINDOWS = CURRENT_OS === 'Windows';
global.ENV_IS_MAC = CURRENT_OS === 'macOS';
global.WILL_OPEN_FILE_PATH = null;

const schema = mainStoreSchema as DeepWriteable<typeof mainStoreSchema>;
const store = new ElectronStore({ schema });
let win;

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
    return store.get('windowBounds') || defaultBounds;
  }

  return defaultBounds;
};

const createWindow = () => {
  win = new BrowserWindow({
    ...getWindowBounds(),
    minWidth: DEFAULT_WINDOW_ATTR.minWidth,
    minHeight: DEFAULT_WINDOW_ATTR.minHeight,
    webPreferences: {
      nodeIntegration: true,
      spellcheck: false,
      webSecurity: false,
      devTools: global.ENV_IS_DEV,
      contextIsolation: false,
    },
  });

  electronRemote.enable(win.webContents);
  win.setMenuBarVisibility(false);

  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: global.APP_NAME,
        submenu: [
          {
            label: `Quit ${global.APP_NAME}`,
            role: 'quit',
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [{ role: 'copy' }, { role: 'paste' }],
      },
      {
        label: 'View',
        submenu: [{ role: 'togglefullscreen' }],
      },
      {
        label: 'Window',
        submenu: [{ role: 'minimize' }, { role: 'front' }],
      },
    ]),
  );

  if (global.IS_MAC) {
    systemPreferences.setUserDefault('NSDisabledDictationMenuItem', 'boolean', true);
    systemPreferences.setUserDefault('NSDisabledCharacterPaletteMenuItem', 'boolean', true);
  }

  if (global.ENV_IS_DEV) {
    win
      .loadURL('http://localhost:5173')
      .catch((e) => {
        console.log(e);
      })
      .then(() => {
        win.webContents.openDevTools();
      });
  } else {
    win.loadFile(join(__dirname, '../index.html')).catch((e) => {
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

  win.webContents.setWindowOpenHandler(({ url }) => ({
    action: url.indexOf('ruffle') === -1 ? 'allow' : 'deny',
  }));
};

const restartApp = () => {
  app.relaunch();
  app.exit();
};

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
  electronRemote.initialize();

  protocol.registerFileProtocol('file', (request, callback) => {
    const pathname = decodeURI(request.url.replace('file:///', ''));
    callback(pathname);
  });

  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
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

ipcMain.on('restart', () => {
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
  } catch (e) {
    store.set({
      recentFiles: [],
    });
  }
});

ipcMain.on('checkFileExist', async (event, args) => {
  win.webContents.send('receiveFileExist', {
    name: args.name,
    path: args.path,
    exist: await fileExists(args.path),
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
