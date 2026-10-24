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
