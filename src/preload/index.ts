import { contextBridge, ipcRenderer, shell } from 'electron';

// Whitelist of valid channels used for IPC communication (Send message from Renderer to Main)
const mainAvailChannels = [
  'mainLoaded',
  'getAppConfig',
  'getRecentFiles',
  'getGlobalValues',
  'setAppConfig',
  'resetAppConfig',
  'appendRecentFiles',
  'checkFileExist',
  'resizeWindow',
  'removeRecentFile',
  'removeAllRecentFile',
];
const rendererAvailChannels = [
  'receiveRecentFiles',
  'receiveFileExist',
  'receiveAppConfig',
  'receiveOpenFile',
  'receiveNextRenderer',
  'receiveResumeToExplorer',
];

contextBridge.exposeInMainWorld('mainApi', {
  openExternal: (url) => shell.openExternal(url),
  send: (channel, data) => {
    if (mainAvailChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, cbFunc) => {
    if (rendererAvailChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => cbFunc(event, ...args));
    }
  },
  removeListener: (event) => {
    ipcRenderer.removeAllListeners(event);
  },
  getGlobalValues: async () => {
    const result = await ipcRenderer.invoke('getGlobalValues');
    return result;
  },
});
