/** @jsxImportSource @emotion/react */
import React from 'react';

import {
  AppBar, Button, ButtonGroup, IconButton, Toolbar, Typography,
} from '@mui/material';
import { ArrowBack, HelpOutline, Settings } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@emotion/react';
import { connect } from 'react-redux';
import { buttonGroupButtonBase, marginRightXs } from '../../utils/styles';

const Header = ({
  title,
  withBackButton,
  withRefresh,
  config,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoToLink = (url) => {
    if (url === location.pathname) {
      if (!withRefresh) return;
      navigate(url);
    } else navigate(url);
  };

  const handleGoHome = (e) => {
    if (e) e.preventDefault();
    if (location.pathname === '/') {
      window.location.reload();
    } else {
      navigate('/explorer');
    }
  };

  return (
    <AppBar
      position="fixed"
      css={css`
        user-select: none;
        background: ${config.isDarkTheme ? '#171717' : '#2c2c2c'};
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
        <ButtonGroup
          variant="text"
          disableRipple
          disableElevation
        >
          <Button
            css={[marginRightXs, buttonGroupButtonBase]}
            color="inherit"
            aria-label="open"
            onClick={() => handleGoToLink('/about')}
          >
            <HelpOutline fontSize="small" />
          </Button>
          <Button
            css={[buttonGroupButtonBase]}
            color="inherit"
            aria-label="open"
            onClick={() => handleGoToLink('/settings')}
          >
            <Settings fontSize="small" />
          </Button>
        </ButtonGroup>
      </Toolbar>
    </AppBar>
  );
};

const mapStateToProps = state => ({
  config: state.config,
});

export default connect(mapStateToProps)(Header);
