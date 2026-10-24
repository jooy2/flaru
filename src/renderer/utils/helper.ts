export const openExternalLink = (ev, link: string): void => {
  if (ev) {
    ev.preventDefault();
  }
  window.mainApi.send('openExternalLink', link);
};
