import { fileURLToPath } from 'url';
import { getFileExtension } from 'qsu/node';

// Whether an address is a web page, the only kind the system browser is asked
// to open on the app's behalf.
export const isWebUrl = (url: string): boolean => {
  try {
    const { protocol } = new URL(url);

    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

// Whether two addresses name the same document, whatever their query and hash.
export const isSameDocument = (url: string, other: string): boolean => {
  try {
    const a = new URL(url);
    const b = new URL(other);

    return a.protocol === b.protocol && a.host === b.host && a.pathname === b.pathname;
  } catch {
    return false;
  }
};

// The SWF file a launch was asked to open. Windows and Linux pass it on the
// command line, among the switches Electron and Chromium add, and a Linux file
// manager may pass it as a `file://` address. macOS sends `open-file` instead.
export const getSwfArgument = (argv: string[]): string | null => {
  const arg = argv
    .slice(1)
    .find((value) => !value.startsWith('-') && getFileExtension(value) === 'swf');

  if (!arg) {
    return null;
  }

  return arg.startsWith('file://') ? fileURLToPath(arg) : arg;
};
