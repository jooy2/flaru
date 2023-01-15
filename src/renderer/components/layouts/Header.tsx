/** @jsxImportSource @emotion/react */
import {
  AppBar,
  Button,
  ButtonGroup,
  IconButton,
  MenuItem,
  Select,
  Toolbar,
  Typography,
} from '@mui/material';
import { ArrowBack, BarChart, HelpOutline, Settings } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@emotion/react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { arrWithNumber } from 'qsu';
import { buttonGroupButtonBase, marginRightXs } from '../../utils/styles';
import * as configActions from '../../store/modules/config';
import ModalMetadata from '../dialogs/ModalMetadata';

const Header = ({ title, withBackButton, withRefresh = false, config, ConfigActions }) => {
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

  const handleOpenMetadata = async () => {
    await ConfigActions.setConfig({ dialogMetadataOpen: true });
  };

  const handleFlashEmulatePlayerVersionChange = async (event) => {
    await ConfigActions.setConfig({ appConfigEmulatePlayerVersion: event.target.value });
  };

  return (
    <AppBar
      position="fixed"
      elevation={1}
      css={css`
        user-select: none;
        background: ${config.isDarkTheme ? '#2c2c2c' : '#ffffff'};
      `}
    >
      <Toolbar variant="dense">
        {withBackButton && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleGoHome}
            edge="start"
            css={css`
              margin-right: 5px;
            `}
          >
            <ArrowBack />
          </IconButton>
        )}
        <Typography
          css={css`
            flex-grow: 1;
          `}
          variant="body1"
          noWrap
        >
          {title}
        </Typography>
        <ButtonGroup variant="text" disableRipple disableElevation>
          {location.pathname === '/player' && (
            <>
              {config.appConfigShowPlayerVersionSelect && (
                <Select
                  size="small"
                  fullWidth
                  value={config.appConfigEmulatePlayerVersion}
                  onChange={handleFlashEmulatePlayerVersionChange}
                  inputProps={{
                    name: 'playerVersion',
                    id: 'player-version',
                  }}
                >
                  {arrWithNumber(0, 32).map((value) => (
                    <MenuItem key={value} value={value}>
                      {value === 0 ? 'Auto' : value}
                    </MenuItem>
                  ))}
                </Select>
              )}
              <Button
                css={[buttonGroupButtonBase]}
                color="inherit"
                onClick={() => handleOpenMetadata()}
              >
                <BarChart fontSize="small" />
              </Button>
            </>
          )}
          {!withBackButton && (
            <>
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
            </>
          )}
        </ButtonGroup>
        <ModalMetadata />
      </Toolbar>
    </AppBar>
  );
};

const mapStateToProps = (state) => ({
  config: state.config,
});

const mapDispatchToProps = (dispatch) => ({
  ConfigActions: bindActionCreators({ ...configActions }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
