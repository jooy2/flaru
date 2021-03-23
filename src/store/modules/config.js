import { createAction, handleActions } from 'redux-actions';

const initialState = {
  flashFileName: '',
  flashFilePath: '',
  recentFiles: [],
};

const SET_CONFIG = 'config/SET_CONFIG';

export const setConfig = createAction(SET_CONFIG);

export default handleActions({
  [SET_CONFIG]: (state, action) => ({
    ...state,
    ...action.payload,
  }),
}, initialState);
