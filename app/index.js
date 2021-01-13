const {
  app, BrowserWindow, protocol, shell,
} = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const electronLocalShortcut = require('electron-localshortcut');

app.commandLine.appendSwitch('disable-web-security');
app.commandLine.appendSwitch('disable-site-isolation-trials');

let win;

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
    },
  });
  win.setMenuBarVisibility(false);
  win.loadURL(isDev ? 'http://localhost:9090' : `file://${path.join(__dirname, '../build/index.html')}`).catch(e => {
    console.log(e);
  }).then(() => {
    if (isDev) {
      win.webContents.openDevTools();
    }
  });
  win.on('focus', () => {
    electronLocalShortcut.register(win, ['CommandOrControl+R', 'CommandOrControl+Shift+R', 'F5'], () => {});
  });
  win.on('blur', () => {
    electronLocalShortcut.unregisterAll(win);
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
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
  app.whenReady().then(() => {
    protocol.registerFileProtocol('file', (request, callback) => {
      const pathname = decodeURI(request.url.replace('file:///', ''));
      callback(pathname);
    });
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
}
