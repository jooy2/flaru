const { app } = require('electron');

const os = require('os');
const pkg = require('../../package.json');

const isDev = () => !app.isPackaged;

const getAppName = () => pkg.description;

const getOS = () => {
  switch (os.platform()) {
    default:
      return 'Unknown';
    case 'win32':
      return 'Windows';
    case 'linux':
    case 'aix':
    case 'sunos':
    case 'netbsd':
    case 'openbsd':
    case 'freebsd':
    case 'cygwin':
    case 'android':
      return 'Linux';
    case 'darwin':
      return 'macOS';
  }
};

const getOSVersion = () => os.release();

module.exports = {
  isDev,
  getAppName,
  getOS,
  getOSVersion,
};
