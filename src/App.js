import React from 'react';
import { Route, HashRouter, Switch } from 'react-router-dom';
import { withRouter } from 'react-router';

import NotFound from './NotFound';
import Main from './screens/Main';
import Explorer from './screens/Explorer';
import Player from './screens/Player';
import About from './screens/About';
import Settings from './screens/Settings';

const App = () => (
  <HashRouter>
    <Switch>
      <Route exact path="/" component={Main} />
      <Route exact path="/explorer" component={Explorer} />
      <Route exact path="/player" component={Player} />
      <Route exact path="/settings" component={Settings} />
      <Route exact path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  </HashRouter>
);

export default withRouter(App);
