export const isExtension = () =>
  typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id);
