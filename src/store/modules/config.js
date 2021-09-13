import { createAction, handleActions } from 'redux-actions';

const initialState = {
  checkVersion: false,
  flashFileName: '',
  flashFilePath: '',
  isDarkTheme: false,
  appConfigTheme: 'light',
  appConfigHideHeader: false,
  appConfigLetterbox: true,
  appConfigHideContext: false,
  appConfigLanguage: 'auto',
  appConfigCurrentLanguage: 'unknown',
  appConfigAllowTracking: true,
  appConfigRestoreWindowBounds: true,
  appConfigUid: '',
  recentFiles: [],
  isAS3Error: false,
};

const SET_CONFIG = 'config/SET_CONFIG';

export const setConfig = createAction(SET_CONFIG);

export default handleActions({
  [SET_CONFIG]: (state, action) => ({
    ...state,
    ...action.payload,
  }),
}, initialState);
