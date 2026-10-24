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
  // The level the volume slider was left at, kept while muted so unmuting goes
  // back to it.
  playerVolume: {
    type: 'number',
    minimum: 0,
    maximum: 100,
    default: 100,
  },
  playerMuted: {
    type: 'boolean',
    default: false,
  },
  // How much of Ruffle's log the player shows beside the movie: `off`, or one of
  // Ruffle's levels from `error` to `trace`.
  debugLogLevel: {
    type: 'string',
    enum: ['off', 'error', 'warn', 'info', 'debug', 'trace'],
    default: 'off',
  },
  // Read before the app is ready, so a change takes effect at the next start.
  hardwareAcceleration: {
    type: 'boolean',
    default: true,
  },
} as const;
