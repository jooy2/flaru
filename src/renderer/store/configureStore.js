import { applyMiddleware, createStore } from 'redux';

import thunk from 'redux-thunk';
import modules from './modules';

const configure = () => createStore(modules, applyMiddleware(thunk));

export default configure;
