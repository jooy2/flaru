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
import { arrWithNumber } from 'qsu';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/renderer/store';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';
import ModalMetadata from '@/renderer/components/dialogs/ModalMetadata';
import { buttonGroupButtonBase, marginRightXs } from '@/renderer/utils/styles';

const Header = ({ title, withBackButton, withRefresh = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const stateAppScreen = useSelector((state: RootState) => state.appScreen);

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
    await dispatch(setConfig({ dialogMetadataOpen: true }));
  };

  const handleFlashEmulatePlayerVersionChange = async (event) => {
    await dispatch(setConfig({ appConfigEmulatePlayerVersion: event.target.value }));
  };

  return (
    <AppBar
      position="fixed"
      elevation={1}
      css={css`
        user-select: none;
        background: ${stateAppScreen.isDarkTheme ? '#2c2c2c' : '#ffffff'};
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
              {stateAppScreen.appConfigShowPlayerVersionSelect && (
                <Select
                  size="small"
                  fullWidth
                  value={stateAppScreen.appConfigEmulatePlayerVersion}
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

export default Header;
