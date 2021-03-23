const { shell } = window.require('@electron/remote');
const remote = window.require('@electron/remote');

export const goToExtLink = async (ev, link) => {
  if (ev) ev.preventDefault();
  await shell.openExternal(link);
};

export const getVersionCode = () => remote.getGlobal('APP_VERSION_CODE');

export const getVersionName = () => remote.getGlobal('APP_VERSION_NAME');

export const getRuffleVersion = () => remote.getGlobal('APP_RUFFLE_VERSION_DATE');

export default {
  goToExtLink,
  getVersionCode,
  getVersionName,
};
