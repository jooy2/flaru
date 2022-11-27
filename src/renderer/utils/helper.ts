const { shell, getGlobal } = window.require('@electron/remote');

export const goToExtLink = async (ev, link) => {
  if (ev) {
    ev.preventDefault();
  }
  await shell.openExternal(link);
};

export const getOS = () => getGlobal('ENV_OS');

export const getVersionName = () => getGlobal('APP_VERSION_NAME');

export const getRuffleVersion = () => getGlobal('APP_RUFFLE_VERSION_DATE');

export const getAuthor = () => getGlobal('APP_AUTHOR');

export const isDarkMode = (theme) => {
  if (theme.theme) {
    return theme.theme.palette.mode === 'dark';
  }
  if (theme.palette) {
    return theme.palette.mode === 'dark';
  }
  return false;
};

export default {
  getOS,
  goToExtLink,
  getVersionName,
  isDarkMode,
};
