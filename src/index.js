import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import App from './App';
import store from './store';
import './i18n';
import ThemeContainer from './components/layouts/ThemeContainer';

ReactDOM.render(
  <Provider store={store}>
    <ThemeContainer>
      <App />
    </ThemeContainer>
  </Provider>,
  document.getElementById('root'),
);
