import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { DebugLogLevel } from '@/renderer/utils/ruffleLog';

interface GlobalValues {
  APP_NAME: string;
  APP_VERSION_NAME: string;
  APP_VERSION_CODE: string;
  APP_VERSION_DATE: string;
  APP_AUTHOR: string;
  APP_RUFFLE_VERSION_DATE: string;
  ENV_IS_DEV: string;
  ENV_OS: string;
  ENV_IS_WINDOWS: string;
  ENV_IS_MAC: string;
  // Whether this run started with hardware acceleration, which a change to the
  // setting does not alter until the next start.
  ENV_HARDWARE_ACCELERATION: boolean;
  WILL_OPEN_FILE_PATH: string;
}

export interface AppScreenState {
  flashFileName: string;
  flashFilePath: string;
  flashFileSwfVer: number;
  flashFileFrame: number;
  flashFileAs3: boolean;
  flashFileWidth: number;
  flashFileHeight: number;
  flashFileBackgroundColor: string;
  flashFileFrameRate: number;
  flashVolume: number;
  // Kept apart from the volume, so unmuting brings back the level the slider was left at.
  flashMuted: boolean;
  isDarkTheme: boolean;
  appConfigTheme: string;
  appConfigHideHeader: boolean;
  appConfigLetterboxMode: string;
  appConfigHideContext: boolean;
  appConfigLanguage: string;
  appConfigCurrentLanguage: string;
  appConfigRestoreWindowBounds: boolean;
  appConfigAdjustOriginalSize: boolean;
  appConfigEmulatePlayerVersion: number;
  appConfigShowPlayerVersionSelect: boolean;
  appConfigShowPlayerController: boolean;
  appConfigPreferredRenderer: string;
  appConfigQuality: string;
  appConfigPlayerRuntime: string;
  appConfigDeviceFontRenderer: string;
  appConfigScale: string;
  appConfigForceScale: boolean;
  appConfigAllowFullscreen: boolean;
  appConfigPauseInBackground: boolean;
  appConfigMaxExecutionDuration: number;
  appConfigHardwareAcceleration: boolean;
  appConfigDebugLogLevel: DebugLogLevel;
  recentFiles: string[];
  mainGlobalValues: GlobalValues;
  dialogMetadataOpen: boolean;
  dialogLocalStorageViewOpen: boolean;
  dialogSettingsOpen: boolean;
  dialogAboutOpen: boolean;
}

const initialState: AppScreenState = {
  flashFileName: '',
  flashFilePath: '',
  flashFileSwfVer: 0,
  flashFileFrame: 0,
  flashFileAs3: false,
  flashFileWidth: 0,
  flashFileHeight: 0,
  flashFileBackgroundColor: '',
  flashFileFrameRate: 0,
  flashVolume: 100,
  flashMuted: false,
  isDarkTheme: false,
  appConfigTheme: 'light',
  appConfigHideHeader: false,
  appConfigLetterboxMode: 'on',
  appConfigHideContext: false,
  appConfigLanguage: 'auto',
  appConfigCurrentLanguage: 'unknown',
  appConfigRestoreWindowBounds: true,
  appConfigAdjustOriginalSize: false,
  appConfigEmulatePlayerVersion: 0,
  appConfigShowPlayerVersionSelect: false,
  appConfigShowPlayerController: true,
  appConfigPreferredRenderer: 'auto',
  appConfigQuality: 'high',
  appConfigPlayerRuntime: 'flashPlayer',
  appConfigDeviceFontRenderer: 'embedded',
  appConfigScale: 'showAll',
  appConfigForceScale: false,
  appConfigAllowFullscreen: false,
  appConfigPauseInBackground: false,
  appConfigMaxExecutionDuration: 15,
  appConfigHardwareAcceleration: true,
  appConfigDebugLogLevel: 'off',
  recentFiles: [],
  mainGlobalValues: {
    APP_NAME: '',
    APP_VERSION_NAME: '',
    APP_VERSION_CODE: '',
    APP_VERSION_DATE: '',
    APP_AUTHOR: '',
    APP_RUFFLE_VERSION_DATE: '',
    ENV_IS_DEV: '',
    ENV_OS: '',
    ENV_IS_WINDOWS: '',
    ENV_IS_MAC: '',
    ENV_HARDWARE_ACCELERATION: true,
    WILL_OPEN_FILE_PATH: '',
  },
  dialogMetadataOpen: false,
  dialogLocalStorageViewOpen: false,
  dialogSettingsOpen: false,
  dialogAboutOpen: false,
};

export const appScreenSlice = createSlice({
  name: 'appScreen',
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<Partial<AppScreenState>>) => ({
      ...state,
      ...action.payload,
    }),
  },
});

export const { setConfig } = appScreenSlice.actions;

export default appScreenSlice.reducer;
