import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import NotFound from './NotFound';
import Main from './screens/Main';
import Explorer from './screens/Explorer';
import Player from './screens/Player';
import About from './screens/About';
import Settings from './screens/Settings';

const App = () => (
  <HashRouter>
    <Routes>
      <Route path="/">
        <Route index element={<Main />} />
        <Route path="/explorer" element={<Explorer />} />
        <Route path="/player" element={<Player />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </HashRouter>
);

export default App;
