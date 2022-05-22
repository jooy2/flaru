const {
  app, BrowserWindow, protocol, ipcMain, dialog, Menu, systemPreferences,
} = require('electron');
const path = require('path');
const electronLocalShortcut = require('electron-localshortcut');
const Store = require('electron-store');
const remoteMain = require('@electron/remote/main');
const {
  getOS, getOSVersion, isDev, getAppName, fileExists,
} = require('./appUtils');
const pkg = require('../package.json');
const commonConfig = require('../config/common.json');
const schema = require('../config/store.json');

remoteMain.initialize();

global.APP_VERSION_NAME = pkg.version;
global.APP_VERSION_CODE = pkg.versionCode;
global.APP_VERSION_DATE = pkg.versionDate;
global.APP_RUFFLE_VERSION_DATE = pkg.ruffleVersionDate;
global.ENV_IS_DEV = isDev();
global.ENV_OS = getOS();
global.ENV_OS_VERSION = getOSVersion();

const MAX_RECENT_FILES = commonConfig.explorer.maxRecentFiles;
const IS_WINDOWS = getOS() === 'Windows';
const IS_MAC_OS = getOS() === 'macOS';
const store = new Store({ schema });
let win;

const openFromExplorer = (argv, argvIndex = 1) => {
  if (IS_WINDOWS && argv && argv.length >= argvIndex
      && argv[argvIndex]?.indexOf('.swf') !== -1) {
    win.webContents.send('receiveNextRenderer', argv[argvIndex]);
    win.webContents.send('receiveOpenFile', argv[argvIndex]);
  } else {
    win.webContents.send('receiveNextRenderer');
  }
};

const getWindowBounds = () => {
  const defaultBounds = {
    width: commonConfig.window.defaultWidth,
    height: commonConfig.window.defaultHeight,
  };
  if (store.get('restoreWindowBounds')) {
    return store.get('windowBounds') || defaultBounds;
  }
  return defaultBounds;
};

const createWindow = () => {
  win = new BrowserWindow({
    ...getWindowBounds(),
    minWidth: commonConfig.window.minWidth,
    minHeight: commonConfig.window.minHeight,
    webPreferences: {
      nodeIntegration: true,
      spellcheck: false,
      webSecurity: false,
      devTools: isDev(),
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  remoteMain.enable(win.webContents);
  win.setMenuBarVisibility(false);

  Menu.setApplicationMenu(Menu.buildFromTemplate([
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
  ]));

  if (IS_MAC_OS) {
    systemPreferences.setUserDefault('NSDisabledDictationMenuItem', 'boolean', 'true');
    systemPreferences.setUserDefault('NSDisabledCharacterPaletteMenuItem', 'boolean', 'true');
  }

  win.loadURL(isDev() ? 'http://localhost:9090' : `file://${path.join(__dirname, '../build/index.html')}`)
    .catch(() => null).then(() => {
      if (isDev()) win.webContents.openDevTools();
    });

  win.on('close', () => {
    store.set({
      windowBounds: win ? win.getBounds() : null,
    });
  });

  win.webContents.once('dom-ready', () => {
    const { argv } = process;

    electronLocalShortcut.register(win, ['F12', 'CommandOrControl+R', 'CommandOrControl+Shift+R'], () => {});

    electronLocalShortcut.register(win, ['Alt+Enter'], () => {
      win.setFullScreen(!win.isFullScreen());
    });

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
    if (!IS_WINDOWS) win.webContents.send('receiveOpenFile', pathParam);
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

  ipcMain.on('mainLoaded', async () => {
    openFromExplorer(process?.argv, 1);
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
      if (!file || file.length < 1) {
        return;
      }
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

  ipcMain.on('resizeWindow', async (event, args) => {
    if (args && args.width && args.height
        && args.width > commonConfig.window.minWidth
        && args.height > commonConfig.window.minHeight) {
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
      const recentFiles = store.get('recentFiles');
      const fileIndex = recentFiles.findIndex(x => x === args.path);
      if (fileIndex !== -1) recentFiles.splice(fileIndex, 1);
      store.set({ recentFiles });
      win.webContents.send('receiveRecentFiles', recentFiles.reverse());
    }
  });

  ipcMain.on('removeAllRecentFile', async () => {
    store.set({ recentFiles: [] });
    win.webContents.send('receiveRecentFiles', []);
  });
}
