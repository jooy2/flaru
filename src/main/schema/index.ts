export default {
  recentFiles: {
    type: 'array',
    default: [],
  },
  hideHeader: {
    type: 'boolean',
    default: false,
  },
  // `off`, `fullscreen` or `on`.
  letterboxMode: {
    type: 'string',
    default: 'on',
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
  preferredRenderer: {
    type: 'string',
    default: 'auto',
  },
  quality: {
    type: 'string',
    default: 'high',
  },
  playerRuntime: {
    type: 'string',
    default: 'flashPlayer',
  },
  deviceFontRenderer: {
    type: 'string',
    default: 'embedded',
  },
  scale: {
    type: 'string',
    default: 'showAll',
  },
  forceScale: {
    type: 'boolean',
    default: false,
  },
  allowFullscreen: {
    type: 'boolean',
    default: false,
  },
  pauseInBackground: {
    type: 'boolean',
    default: false,
  },
  // In seconds.
  maxExecutionDuration: {
    type: 'number',
    default: 15,
  },
  // Read before the app is ready, so a change takes effect at the next start.
  hardwareAcceleration: {
    type: 'boolean',
    default: true,
  },
} as const;
