const {
  app, BrowserWindow, protocol, shell, ipcMain, dialog,
} = require('electron');
const path = require('path');
const electronLocalShortcut = require('electron-localshortcut');
const Store = require('electron-store');
const fs = require('fs');
const { getOS, getOSVersion } = require('./appUtils');
const pkg = require('../package.json');
require('@electron/remote/main').initialize();

global.APP_VERSION_NAME = pkg.version;
global.APP_VERSION_CODE = pkg.versionCode;
global.APP_RUFFLE_VERSION_DATE = pkg.ruffleVersionDate;
global.ENV_OS = getOS();
global.ENV_OS_VERSION = getOSVersion();
const MAX_RECENT_FILES = 5;

const isDev = !app.isPackaged;
const isWindows = process.platform === 'win32';
const store = new Store();
let win;

function createSettings() {
  if (store.size < 1) {
    store.set({
      firstScreen: 'explorer',
      recentFiles: [],
    });
  }
}

function getRecentFiles() {
  const recentFiles = store.get('recentFiles');
  if (!recentFiles) {
    store.set({
      recentFiles: [],
    });
    return [];
  }
  return recentFiles;
}

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

function createWindow() {
  win = new BrowserWindow({
    width: process.env.NODE_ENV === 'dev' ? 1300 : 750,
    height: 620,
    minHeight: 620,
    minWidth: 750,
    webPreferences: {
      nodeIntegration: true,
      spellcheck: false,
      webSecurity: false,
      devTools: process.env.NODE_ENV === 'dev',
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadURL(isDev ? 'http://localhost:9090' : `file://${path.join(__dirname, '../build/index.html')}`).catch(e => {
    // eslint-disable-next-line no-console
    console.log(e);
  }).then(() => {
    if (isDev) win.webContents.openDevTools();
  });
  win.on('focus', () => {
    electronLocalShortcut.register(win, ['CommandOrControl+R', 'CommandOrControl+Shift+R', 'F5'], () => {});
  });
  win.on('blur', () => {
    electronLocalShortcut.unregisterAll(win);
  });
  win.webContents.once('dom-ready', () => {
    const { argv } = process;
    openFromExplorer(argv, 1);
  });
  win.webContents.on('new-window', async (event, url) => {
    event.preventDefault();
    if (url.indexOf('ruffle') === -1) {
      await shell.openExternal(url);
    }
  });
}

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
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
  app.whenReady().then(() => {
    protocol.registerFileProtocol('file', (request, callback) => {
      const pathname = decodeURI(request.url.replace('file:///', ''));
      callback(pathname);
    });
    createSettings();
    createWindow();
  });
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
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
    win.webContents.send('receiveRecentFiles', getRecentFiles().reverse());
  });

  ipcMain.on('setAppConfig', (event, args) => {
    store.set(args);
  });

  ipcMain.on('resetAppConfig', () => {
    store.clear();
    app.relaunch();
    app.exit();
  });

  ipcMain.on('appendRecentFiles', (event, file) => {
    try {
      const recentFiles = getRecentFiles();
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
      const recentFiles = getRecentFiles();
      const fileIndex = recentFiles.findIndex(x => x === args.path);
      if (fileIndex !== -1) recentFiles.splice(fileIndex, 1);
      store.set({ recentFiles });
      win.webContents.send('receiveRecentFiles', recentFiles.reverse());
    }
  });
}
