const { shell } = window.require('@electron/remote');
const remote = window.require('@electron/remote');

export const goToExtLink = async (ev, link) => {
  if (ev) ev.preventDefault();
  await shell.openExternal(link);
};

export const getOS = () => remote.getGlobal('ENV_OS');

export const getOSVersion = () => remote.getGlobal('ENV_OS_VERSION');

export const getVersionCode = () => remote.getGlobal('APP_VERSION_CODE');

export const getVersionName = () => remote.getGlobal('APP_VERSION_NAME');

export const getRuffleVersion = () => remote.getGlobal('APP_RUFFLE_VERSION_DATE');

export const isOnline = () => (window ? window.navigator.onLine : false);

export const isProduction = () => !remote.getGlobal('ENV_IS_DEV');

export default {
  getOS,
  getOSVersion,
  goToExtLink,
  getVersionCode,
  getVersionName,
  isOnline,
  isProduction,
};
