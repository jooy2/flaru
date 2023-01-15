import { createAction, handleActions } from 'redux-actions';

const initialState = {
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

const SET_CONFIG = 'config/SET_CONFIG';

export const setConfig = createAction(SET_CONFIG);

export default handleActions(
  {
    [SET_CONFIG]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
  },
  initialState,
);
