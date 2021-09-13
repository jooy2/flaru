/** @jsxImportSource @emotion/react */
import React from 'react';

import {
  AppBar, IconButton, Toolbar, Typography,
} from '@mui/material';
import { ArrowBack, HelpOutline } from '@mui/icons-material';
import { useHistory, useLocation } from 'react-router-dom';
import { css } from '@emotion/react';

const Header = ({ title, withBackButton, withHelpButton }) => {
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
    <AppBar
      position="fixed"
      css={css`
        user-select: none;
        background: #383838;
      `}
    >
      <Toolbar variant="dense">
        {withBackButton
        && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleGoHome}
          edge="start"
          css={css`margin-right: 5px`}
        >
          <ArrowBack />
        </IconButton>
        )}
        <Typography css={css`flex-grow: 1`} variant="body1" noWrap>
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
