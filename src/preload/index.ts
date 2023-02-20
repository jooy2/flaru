import { contextBridge, ipcRenderer } from 'electron';

// Whitelist of valid channels used for IPC communication (Send message from Renderer to Main)
const mainAvailChannels: string[] = [
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
  'openExternalLink',
];
const rendererAvailChannels: string[] = [
  'receiveRecentFiles',
  'receiveFileExist',
  'receiveAppConfig',
  'receiveOpenFile',
  'receiveNextRenderer',
  'receiveResumeToExplorer',
];

contextBridge.exposeInMainWorld('mainApi', {
  send: (channel: string, ...data: any[]): void => {
    if (mainAvailChannels.includes(channel)) {
      ipcRenderer.send.apply(null, [channel, ...data]);
    }
  },
  receive: (channel: string, cbFunc: Function): void => {
    if (rendererAvailChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => cbFunc(event, ...args));
    }
  },
  removeListener: (event: string): void => {
    ipcRenderer.removeAllListeners(event);
  },
  getGlobalValues: async (): Promise<any> => {
    const result = await ipcRenderer.invoke('getGlobalValues');
    return result;
  },
});
