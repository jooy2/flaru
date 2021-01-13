export const goToExtLink = async (ev, link) => {
  const { shell } = window.require('electron');
  ev.preventDefault();
  await shell.openExternal(link);
};

export const getVersionCode = () => 1;

export const getVersionName = () => '0.1.0';

export default {
  goToExtLink,
  getVersionCode,
  getVersionName,
};
