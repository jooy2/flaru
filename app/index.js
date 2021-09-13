const {
  app, BrowserWindow, protocol, ipcMain, dialog, Menu, systemPreferences,
} = require('electron');
const path = require('path');
const electronLocalShortcut = require('electron-localshortcut');
const Store = require('electron-store');
const fs = require('fs');
const {
  getOS, getOSVersion, isDev, getAppName,
} = require('./appUtils');
const pkg = require('../package.json');
const schema = require('../config/store.json');
require('@electron/remote/main').initialize();

global.APP_VERSION_NAME = pkg.version;
global.APP_VERSION_CODE = pkg.versionCode;
global.APP_VERSION_DATE = pkg.versionDate;
global.APP_RUFFLE_VERSION_DATE = pkg.ruffleVersionDate;
global.ENV_IS_DEV = isDev();
global.ENV_OS = getOS();
global.ENV_OS_VERSION = getOSVersion();
const MAX_RECENT_FILES = 5;

const isWindows = process.platform === 'win32';
const store = new Store({ schema });
let win;

const fileExists = async p => !!(await fs.promises.stat(p).catch(() => false));

const openFromExplorer = (argv, argvIndex = 1) => {
  if (isWindows && argv && argv.length >= argvIndex
      && argv[argvIndex]?.indexOf('.swf') !== -1) {
    win.webContents.send('receiveNextRenderer', argv[argvIndex]);
    win.webContents.send('receiveOpenFile', argv[argvIndex]);
  } else {
    win.webContents.send('receiveNextRenderer');
  }
};

const getWindowBounds = () => {
  const defaultBounds = {
    width: 1300,
    height: 800,
  };
  if (store.get('restoreWindowBounds')) {
    return store.get('windowBounds') || defaultBounds;
  }
  return defaultBounds;
};

const createWindow = () => {
  win = new BrowserWindow({
    ...getWindowBounds(),
    minHeight: 620,
    minWidth: 750,
    webPreferences: {
      nodeIntegration: true,
      spellcheck: false,
      webSecurity: false,
      devTools: isDev(),
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  win.setMenuBarVisibility(false);
  const menu = Menu.buildFromTemplate([
    {
      label: getAppName(),
      submenu: [
        {
          label: `Quit ${getAppName()}`,
          role: 'quit',
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'front' },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);

  if (getOS() === 'Mac') {
    systemPreferences.setUserDefault('NSDisabledDictationMenuItem', 'boolean', 'true');
    systemPreferences.setUserDefault('NSDisabledCharacterPaletteMenuItem', 'boolean', 'true');
  }

  win.loadURL(isDev() ? 'http://localhost:9090' : `file://${path.join(__dirname, '../build/index.html')}`).catch(() => null).then(() => {
    if (isDev()) win.webContents.openDevTools();
  });
  win.webContents.once('dom-ready', () => {
    const { argv } = process;
    openFromExplorer(argv, 1);
  });
  win.on('close', () => {
    store.set({
      windowBounds: win ? win.getBounds() : null,
    });
  });
  win.webContents.once('dom-ready', () => {
    const { argv } = process;
    electronLocalShortcut.register(win, ['F12', 'CommandOrControl+R', 'CommandOrControl+Shift+R'], () => {});
    electronLocalShortcut.register(win, 'F5', () => {
      win.webContents.send('receiveResumeToExplorer');
    });
    openFromExplorer(argv, 1);
  });

  win.webContents.setWindowOpenHandler(({ url }) => ({ action: url.indexOf('ruffle') === -1 ? 'allow' : 'deny' }));
};

const closeApp = () => {
  app.quit();
};

const restartApp = () => {
  app.relaunch();
  app.exit();
};

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (e, argv) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      openFromExplorer(argv, 2);
    }
  });
  app.on('open-file', (event, pathParam) => {
    event.preventDefault();
    if (!isWindows) win.webContents.send('receiveOpenFile', pathParam);
  });
  app.whenReady().then(() => {
    protocol.registerFileProtocol('file', (request, callback) => {
      const pathname = decodeURI(request.url.replace('file:///', ''));
      callback(pathname);
    });
    createWindow();
  });
  app.on('window-all-closed', () => {
    closeApp();
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  ipcMain.on('getAppConfig', () => {
    win.webContents.send('receiveAppConfig', store.store);
  });

  ipcMain.on('getRecentFiles', () => {
    win.webContents.send('receiveRecentFiles', store.get('recentFiles').reverse());
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
      const recentFiles = store.get('recentFiles');
      const fileIndex = recentFiles.findIndex(x => x === file);
      if (fileIndex !== -1) recentFiles.splice(fileIndex, 1);
      recentFiles.push(file);
      if (recentFiles.length > MAX_RECENT_FILES) recentFiles.shift();
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

  ipcMain.on('removeRecentFile', async (event, args) => {
    const response = await dialog.showMessageBox(win, {
      type: 'info',
      title: args.title,
      message: args.message,
    });
    if (response && response.response < 2) {
      const recentFiles = store.get('recentFiles');
      const fileIndex = recentFiles.findIndex(x => x === args.path);
      if (fileIndex !== -1) recentFiles.splice(fileIndex, 1);
      store.set({ recentFiles });
      win.webContents.send('receiveRecentFiles', recentFiles.reverse());
    }
  });
}
