const os = require('os');
const fs = require('fs');

const getOS = () => {
  switch (os.platform()) {
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
    default:
      return 'Unknown';
  }
};

const getOSVersion = () => os.release();

const fileExists = async p => !!(await fs.promises.stat(p).catch(() => false));

module.exports = {
  getOS,
  getOSVersion,
  fileExists,
};
