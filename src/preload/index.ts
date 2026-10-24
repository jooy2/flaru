import { contextBridge, ipcRenderer, webUtils } from 'electron';

// Whitelist of valid channels used for IPC communication (Send message from Renderer to Main)
const mainAvailChannels: string[] = [
  'mainLoaded',
  'getAppConfig',
  'getRecentFiles',
  'getGlobalValues',
  'getFileNameFromPath',
  'getDirnameFromPath',
  'setAppConfig',
  'resetAppConfig',
  'restart',
  'appendRecentFiles',
  'checkFileExist',
  'resizeWindow',
  'removeRecentFile',
  'removeAllRecentFile',
  'startStaticServer',
  'openExternalLink',
  'getAutoLaunch',
  'setAutoLaunch',
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  receive: (channel: string, cbFunc: Function): void => {
    if (rendererAvailChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => cbFunc(event, ...args));
    }
  },
  invoke: async (channel: string, ...data: any[]): Promise<any> => {
    if (mainAvailChannels.includes(channel)) {
      const result = await ipcRenderer.invoke.apply(null, [channel, ...data]);
      return result;
    }

    throw new Error(`Unknown ipc channel name: ${channel}`);
  },
  removeListener: (event: string): void => {
    ipcRenderer.removeAllListeners(event);
  },
  getGlobalValues: async (): Promise<any> => {
    const result = await ipcRenderer.invoke('getGlobalValues');
    return result;
  },
  getFileNameFromPath: async (filePath: string, withExtension?: boolean) => {
    const result = await ipcRenderer.invoke('getFileNameFromPath', filePath, withExtension);
    return result;
  },
  getDirnameFromPath: async (filePath: string, withExtension?: boolean) => {
    const result = await ipcRenderer.invoke('getDirnameFromPath', filePath, withExtension);
    return result;
  },
  startStaticServer: async (url: string) => {
    const result = await ipcRenderer.invoke('startStaticServer', url);
    return result;
  },
  showFilePath(file: File) {
    return webUtils.getPathForFile(file);
  },
});
