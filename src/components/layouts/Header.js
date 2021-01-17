import React from 'react';

import {
  AppBar, IconButton, Toolbar, Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ArrowBack } from '@material-ui/icons';
import { useHistory, useLocation } from 'react-router-dom';

const useStyles = makeStyles(() => ({
  root: {
    userSelect: 'none',
  },
  title: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: 5,
  },
}));

const Header = ({ title, withBackButton }) => {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();

  const handleGoHome = (e) => {
    if (e) e.preventDefault();
    if (location.pathname === '/') {
      window.location.reload();
      return;
    }
    history.push('/');
  };

  return (
    <div className={classes.root}>
      <AppBar position="fixed" style={{ background: '#383838' }}>
        <Toolbar variant="dense">
          {withBackButton
          && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleGoHome}
            edge="start"
            className={classes.menuButton}
          >
            <ArrowBack />
          </IconButton>
          )}
          <Typography className={classes.title} variant="body1" noWrap>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default Header;
