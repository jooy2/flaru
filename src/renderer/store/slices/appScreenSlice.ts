import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

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
  isDarkTheme: boolean;
  appConfigTheme: string;
  appConfigHideHeader: boolean;
  appConfigLetterbox: boolean;
  appConfigHideContext: boolean;
  appConfigLanguage: string;
  appConfigCurrentLanguage: string;
  appConfigRestoreWindowBounds: boolean;
  appConfigAdjustOriginalSize: boolean;
  appConfigEmulatePlayerVersion: number;
  appConfigShowPlayerVersionSelect: boolean;
  appConfigShowPlayerController: boolean;
  recentFiles: string[];
  mainGlobalValues: GlobalValues;
  dialogMetadataOpen: boolean;
  dialogLocalStorageViewOpen: boolean;
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
  isDarkTheme: false,
  appConfigTheme: 'light',
  appConfigHideHeader: false,
  appConfigLetterbox: true,
  appConfigHideContext: false,
  appConfigLanguage: 'auto',
  appConfigCurrentLanguage: 'unknown',
  appConfigRestoreWindowBounds: true,
  appConfigAdjustOriginalSize: false,
  appConfigEmulatePlayerVersion: 0,
  appConfigShowPlayerVersionSelect: false,
  appConfigShowPlayerController: true,
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
    WILL_OPEN_FILE_PATH: '',
  },
  dialogMetadataOpen: false,
  dialogLocalStorageViewOpen: false,
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
