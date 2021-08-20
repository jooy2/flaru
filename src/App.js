import React from 'react';
import { Route, HashRouter, Switch } from 'react-router-dom';
import { withRouter } from 'react-router';

import NotFound from './NotFound';
import Home from './screens/Home';
import Explorer from './screens/Explorer';
import Player from './screens/Player';
import About from './screens/About';

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
