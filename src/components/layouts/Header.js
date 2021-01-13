import React from 'react';

import { AppBar, Toolbar, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  root: {
    userSelect: 'none',
  },
}));

const Header = ({ title }) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <AppBar position="fixed" style={{ background: '#383838' }}>
        <Toolbar variant="dense">
          <Typography variant="h6" noWrap>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default Header;
