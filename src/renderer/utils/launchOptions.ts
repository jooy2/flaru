// Options the explorer applies to a file it starts, on top of the settings. They
// are FlashArch's per-item player options that the settings do not already
// cover, and they last until the app closes.
export interface LaunchOptions {
  // Blocks networking, script access and opening pages.
  strictMode: boolean;
  // 0 lets Ruffle choose.
  playerVersion: number;
  // 0 lets the movie choose.
  frameRate: number;
  // Written as `a=123&b=456`.
  parameters: string;
}

export const DEFAULT_LAUNCH_OPTIONS: LaunchOptions = {
  strictMode: false,
  playerVersion: 0,
  frameRate: 0,
  parameters: '',
};

export const LAUNCH_LIMITS = {
  frameRate: 120,
  parameters: 2000,
};

export const isDefaultLaunchOptions = (options: LaunchOptions): boolean =>
  (Object.keys(DEFAULT_LAUNCH_OPTIONS) as (keyof LaunchOptions)[]).every(
    (key) => options[key] === DEFAULT_LAUNCH_OPTIONS[key],
  );
