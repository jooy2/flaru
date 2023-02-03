import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

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
  recentFiles: string[];
  dialogMetadataOpen: boolean;
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
  recentFiles: [],
  dialogMetadataOpen: false,
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
