import React from 'react';

import {
  AppBar, IconButton, Toolbar, Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ArrowBack, HelpOutline } from '@material-ui/icons';
import { useHistory, useLocation } from 'react-router-dom';

const useStyles = makeStyles(() => ({
  root: {
    userSelect: 'none',
    background: '#383838',
  },
  title: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: 5,
  },
}));

const Header = ({ title, withBackButton, withHelpButton }) => {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();

  const handleGoHome = (e) => {
    if (e) e.preventDefault();
    if (location.pathname === '/') {
      window.location.reload();
    } else {
      history.push('/explorer');
    }
  };

  return (
    <AppBar position="fixed" className={classes.root}>
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
        {withHelpButton
        && (
        <IconButton
          color="inherit"
          aria-label="open"
          onClick={() => history.push('/about')}
          edge="end"
        >
          <HelpOutline />
        </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
