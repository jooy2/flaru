import { v4 } from 'uuid';
import { isProduction } from './helper';

export const generateUid = () => new Promise(resolve => {
  const electron = window.require('electron');
  const { ipcRenderer } = electron;
  const uid = isProduction() ? v4() : 'test-test-test-test-test';
  ipcRenderer.send('setAppConfig', { uid });
  resolve();
});

export default {
  generateUid,
};
