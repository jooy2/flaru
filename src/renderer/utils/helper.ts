export const openExternalLink = async (ev, link) => {
  if (ev) {
    ev.preventDefault();
  }
  window.mainApi.send('openExternalLink', link);
};

export const isDarkMode = (theme) => {
  if (theme.theme) {
    return theme.theme.palette.mode === 'dark';
  }
  if (theme.palette) {
    return theme.palette.mode === 'dark';
  }
  return false;
};

export const arrWithNumber = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, i) => i + start);

export default {
  openExternalLink,
  isDarkMode,
  arrWithNumber,
};
