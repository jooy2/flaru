/** @jsxImportSource @emotion/react */
import { useState } from 'react';
import {
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { css } from '@emotion/react';
import Layout from '../components/layouts/Layout';
import * as configActions from '../store/modules/config';
import { marginTopMd } from '../utils/styles';
import PanelHeader from '../components/views/PanelHeader';

const Settings = ({ config, ConfigActions }) => {
  const [t, i18n] = useTranslation(['common', 'notice', 'menu']);
  const [themeCheck, setThemeCheck] = useState(config.appConfigTheme);
  const [language, setLanguage] = useState(config.appConfigLanguage);
  const [hideHeaderChecked, setHideHeaderChecked] = useState(config.appConfigHideHeader);
  const [letterboxChecked, setLetterboxChecked] = useState(config.appConfigLetterbox);
  const [hideContextChecked, setHideContextChecked] = useState(config.appConfigHideContext);
  const [showPlayerVersionSelectChecked, setShowPlayerVersionSelectChecked] = useState(
    config.appConfigShowPlayerVersionSelect,
  );
  const [restoreWindowBoundsChecked, setRestoreBoundsChecked] = useState(
    config.appConfigRestoreWindowBounds,
  );
  const [adjustOriginalSizeChecked, setAdjustOriginalSizeChecked] = useState(
    config.appConfigAdjustOriginalSize,
  );
  const { ipcRenderer } = window.require('electron');
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const handleRadioChange = async (event): Promise<void> => {
    const { value } = event.target;
    switch (event.target.name) {
      case 'themeCheck':
        setThemeCheck(value);
        ipcRenderer.send('setAppConfig', { theme: value });
        await ConfigActions.setConfig({ appConfigTheme: value });
        if (value === 'auto') {
          await ConfigActions.setConfig({ isDarkTheme: prefersDarkMode });
        } else {
          await ConfigActions.setConfig({ isDarkTheme: value !== 'light' });
        }
        break;
      default:
        break;
    }
  };

  const handleCheckboxChange = async (event): Promise<void> => {
    const value = event.target.checked;
    switch (event.target.name) {
      case 'hideHeaderChecked':
        setHideHeaderChecked(value);
        ipcRenderer.send('setAppConfig', { hideHeader: value });
        await ConfigActions.setConfig({ appConfigHideHeader: value });
        break;
      case 'letterboxChecked':
        setLetterboxChecked(value);
        ipcRenderer.send('setAppConfig', { letterbox: value });
        await ConfigActions.setConfig({ appConfigLetterbox: value });
        break;
      case 'hideContextChecked':
        setHideContextChecked(value);
        ipcRenderer.send('setAppConfig', { hideContext: value });
        await ConfigActions.setConfig({ appConfigHideContext: value });
        break;
      case 'restoreWindowBoundsChecked':
        setRestoreBoundsChecked(value);
        ipcRenderer.send('setAppConfig', { restoreWindowBounds: value });
        await ConfigActions.setConfig({ appConfigRestoreWindowBounds: value });
        break;
      case 'adjustOriginalSizeChecked':
        setAdjustOriginalSizeChecked(value);
        ipcRenderer.send('setAppConfig', { adjustOriginalSize: value });
        await ConfigActions.setConfig({ appConfigAdjustOriginalSize: value });
        break;
      case 'showPlayerVersionSelectChecked':
        setShowPlayerVersionSelectChecked(value);
        ipcRenderer.send('setAppConfig', { showPlayerVersionSelect: value });
        await ConfigActions.setConfig({ appConfigShowPlayerVersionSelect: value });
        break;
      default:
        break;
    }
  };

  const handleSelectChange = async (event): Promise<void> => {
    const { value } = event.target;
    switch (event.target.name) {
      case 'language':
        setLanguage(value);
        ipcRenderer.send('setAppConfig', { language: value });
        await ConfigActions.setConfig({ appConfigLanguage: value });
        await i18n.changeLanguage(value);
        break;
      default:
        break;
    }
  };

  const handleReset = (ev, clearData): void => {
    if (ev) ev.preventDefault();
    if (clearData) {
      ipcRenderer.send('resetAppConfig');
    } else {
      ipcRenderer.send('restart');
    }
  };

  return (
    <Layout title={t('menu:settings') as string} withBackButton>
      <Grid
        item
        xs={12}
        css={css`
          max-height: calc(100vh - 68px);
          overflow-y: auto;
          span {
            font-size: 0.95em;
            color: ${config.isDarkTheme ? '#efefef' : '#4f4f4f'};
          }
        `}
      >
        <Paper
          css={css`
            padding: 16px;
          `}
        >
          <Typography component="h2" variant="h4">
            {t('menu:settings')}
          </Typography>
          <Typography component="span">{t('settings-info')}</Typography>
          <Grid
            container
            spacing={3}
            css={css`
              margin-top: 24px;
              h3 {
                font-size: 1.2em;
                font-weight: bold;
              }
              button > span {
                color: #1c1c1c;
              }
              span {
                font-size: 0.75em;
                color: ${config.isDarkTheme ? '#efefef' : '#4f4f4f'};
              }
            `}
          >
            <Grid item xs={12}>
              <PanelHeader
                title={t('settings-language-title')}
                desc={t('settings-language-desc')}
              />
              <Typography component="div">
                <Select
                  size="small"
                  fullWidth
                  value={language}
                  onChange={handleSelectChange}
                  inputProps={{
                    name: 'language',
                    id: 'system-language',
                  }}
                >
                  {['auto', 'ko', 'en', 'es', 'pt', 'de', 'fr', 'ja'].map((value) => (
                    <MenuItem key={value} value={value}>
                      {t(`menu:language-${value}`)}
                    </MenuItem>
                  ))}
                </Select>
              </Typography>
            </Grid>
            <Grid item xs={12} css={marginTopMd}>
              <PanelHeader title={t('settings-title-1')} desc={t('settings-desc-1')} />
              <Grid container>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        checked={hideHeaderChecked}
                        onChange={handleCheckboxChange}
                        name="hideHeaderChecked"
                      />
                    }
                    label={t('menu:hide-header')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        checked={letterboxChecked}
                        onChange={handleCheckboxChange}
                        name="letterboxChecked"
                      />
                    }
                    label={t('menu:letterbox')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        checked={hideContextChecked}
                        onChange={handleCheckboxChange}
                        name="hideContextChecked"
                      />
                    }
                    label={t('menu:hide-context')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        checked={adjustOriginalSizeChecked}
                        onChange={handleCheckboxChange}
                        name="adjustOriginalSizeChecked"
                      />
                    }
                    label={t('menu:adjust-original-size')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        checked={showPlayerVersionSelectChecked}
                        onChange={handleCheckboxChange}
                        name="showPlayerVersionSelectChecked"
                      />
                    }
                    label={t('menu:show-player-version-select')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        checked={restoreWindowBoundsChecked}
                        onChange={handleCheckboxChange}
                        name="restoreWindowBoundsChecked"
                      />
                    }
                    label={t('menu:restore-bounds')}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} css={marginTopMd}>
              <PanelHeader title={t('settings-title-2')} desc={t('settings-desc-2')} />
              <RadioGroup
                row
                aria-label="theme"
                name="themeCheck"
                value={themeCheck}
                defaultValue="light"
                onChange={handleRadioChange}
              >
                <FormControlLabel
                  value="auto"
                  control={<Radio size="small" />}
                  label={t('menu:theme-auto')}
                />
                <FormControlLabel
                  value="light"
                  control={<Radio size="small" />}
                  label={t('menu:theme-light')}
                />
                <FormControlLabel
                  value="dark"
                  control={<Radio size="small" />}
                  label={t('menu:theme-dark')}
                />
              </RadioGroup>
            </Grid>
            <Grid item xs={12} css={marginTopMd}>
              <PanelHeader title={t('settings-reset-title')} desc={t('settings-reset-desc')} />
              <Typography component="div" css={marginTopMd}>
                <Button variant="contained" size="medium" onClick={(ev) => handleReset(ev, true)}>
                  {t('menu:reset-and-restart')}
                </Button>
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Layout>
  );
};

const mapStateToProps = (state) => ({
  config: state.config,
});

const mapDispatchToProps = (dispatch) => ({
  ConfigActions: bindActionCreators({ ...configActions }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
