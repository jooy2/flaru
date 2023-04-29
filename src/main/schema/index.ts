export default {
  recentFiles: {
    type: 'array',
    default: [],
  },
  hideHeader: {
    type: 'boolean',
    default: false,
  },
  letterbox: {
    type: 'boolean',
    default: true,
  },
  hideContext: {
    type: 'boolean',
    default: false,
  },
  theme: {
    type: 'string',
    default: 'auto',
  },
  language: {
    type: 'string',
    default: 'auto',
  },
  restoreWindowBounds: {
    type: 'boolean',
    default: true,
  },
  windowBounds: {
    type: 'object',
  },
  adjustOriginalSize: {
    type: 'boolean',
    default: false,
  },
  showPlayerVersionSelect: {
    type: 'boolean',
    default: false,
  },
  showPlayerController: {
    type: 'boolean',
    default: true,
  },
} as const;
