export const goToExtLink = async (ev, link) => {
  const { shell } = window.require('electron');
  ev.preventDefault();
  await shell.openExternal(link);
};

export const getVersionCode = () => 2;

export const getVersionName = () => '0.2.0';

export default {
  goToExtLink,
  getVersionCode,
  getVersionName,
};
