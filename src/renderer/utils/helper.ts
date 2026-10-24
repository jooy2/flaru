export const openExternalLink = (ev, link: string): void => {
  if (ev) {
    ev.preventDefault();
  }
  window.mainApi.send('openExternalLink', link);
};

// The last part of a path, whichever separator its system uses.
export const getBaseName = (filePath: string): string => filePath.split(/[\\/]/).pop() || filePath;
