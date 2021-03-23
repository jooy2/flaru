import React from 'react';
import { Route, HashRouter, Switch } from 'react-router-dom';
import { withRouter } from 'react-router';

import NotFound from './NotFound';
import Home from './pages/Home';
import Explorer from './pages/Explorer';
import Player from './pages/Player';
import About from './pages/About';

const App = () => (
  <HashRouter>
    <Switch>
      <Route exact path="/" component={Home} />
      <Route exact path="/explorer" component={Explorer} />
      <Route exact path="/player" component={Player} />
      <Route exact path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  </HashRouter>
);

export default withRouter(App);
