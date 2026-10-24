import { app } from 'electron';

// Starting the app when the user signs in is the operating system's setting, so
// it is read from there each time rather than kept in the app's own settings.
// The user can turn it off outside the app, and the app shows that.

type AutoLaunchState = {
  isSupported: boolean;
  isEnabled: boolean;
};

let isE2E = false;
let e2eEnabled = false;

// Electron registers login items only on macOS and Windows.
const isSupported = (): boolean => process.platform === 'darwin' || process.platform === 'win32';

// A portable Windows build runs from a folder it extracts again on every start,
// so the login item points at the file the user opened instead.
const getLoginItemPath = (): string => process.env.PORTABLE_EXECUTABLE_FILE || process.execPath;

export const initAutoLaunch = (options: { e2e: boolean }): void => {
  isE2E = options.e2e;
};

export const getAutoLaunch = (): AutoLaunchState => {
  if (!isSupported()) {
    return { isSupported: false, isEnabled: false };
  }

  // End-to-end runs must not add a login item to the machine running them.
  if (isE2E) {
    return { isSupported: true, isEnabled: e2eEnabled };
  }

  return {
    isSupported: true,
    isEnabled: app.getLoginItemSettings({ path: getLoginItemPath() }).openAtLogin,
  };
};

export const setAutoLaunch = (isEnabled: boolean): AutoLaunchState => {
  if (!isSupported()) {
    return getAutoLaunch();
  }

  if (isE2E) {
    e2eEnabled = isEnabled === true;
  } else {
    app.setLoginItemSettings({ openAtLogin: isEnabled === true, path: getLoginItemPath() });
  }

  return getAutoLaunch();
};
