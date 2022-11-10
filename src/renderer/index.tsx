import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import store from './store';
import './i18n';
import ThemeContainer from './components/layouts/ThemeContainer';

createRoot(document.getElementById('app')!).render(
  <Provider store={store}>
    <ThemeContainer>
      <App />
    </ThemeContainer>
  </Provider>,
);
