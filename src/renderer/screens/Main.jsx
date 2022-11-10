/** @jsxImportSource @emotion/react */
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { CircularProgress, Grid, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/react';
import * as configActions from '../store/modules/config';
import Layout from '../components/layouts/Layout';
import { loadingText } from '../utils/styles';

const Main = ({ ConfigActions }) => {
  const theme = useTheme();
  const [t, i18n] = useTranslation(['common']);
  const [loadMsg, setLoadMsg] = useState(1);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const navigate = useNavigate();
  const { ipcRenderer } = window.require('electron');

  const handleVersionCheck = async () => true; // TODO version check

  const runFromExplorer = async (filePath) => {
    await ConfigActions.setConfig({
      flashFileName: filePath.split('\\').pop(),
      flashFilePath: filePath,
    });
    ipcRenderer.send('appendRecentFiles', filePath);
    navigate('/player');
  };

  const getLanguage = () => {
    if (i18n.languages && i18n.languages.length > 0) {
      if (i18n.languages[0] === 'auto') {
        return i18n.languages[1] || 'unknown';
      }
      return i18n.languages[0];
    }
    return 'unknown';
  };

  const loadOrMove = (filePath) => {
    handleVersionCheck().then(async (result) => {
      if (!result) {
        return;
      }

      setLoadMsg(2);

      ipcRenderer.on('receiveAppConfig', async (appConfigEvent, configs) => {
        await ConfigActions.setConfig({
          appConfigHideHeader: configs.hideHeader,
          appConfigTheme: configs.theme,
          appConfigHideContext: configs.hideContext,
          appConfigLetterbox: configs.letterbox,
          appConfigLanguage: configs.language,
          appConfigCurrentLanguage: getLanguage(),
          appConfigRestoreWindowBounds: configs.restoreWindowBounds,
          appConfigAdjustOriginalSize: configs.adjustOriginalSize,
        });

        if (configs.theme === 'auto') {
          await ConfigActions.setConfig({
            appConfigTheme: 'auto',
            isDarkTheme: prefersDarkMode,
          });
        } else {
          await ConfigActions.setConfig({
            appConfigTheme: configs.theme,
            isDarkTheme: configs.theme !== 'light',
          });
        }

        if (configs.language !== 'auto') {
          await i18n.changeLanguage(configs.language);
        }

        ipcRenderer.on('receiveOpenFile', async (openFileEvent, receivePath) => {
          await runFromExplorer(receivePath);
        });

        setLoadMsg(3);

        if (filePath) {
          await runFromExplorer(filePath);
        } else {
          navigate('/explorer');
        }
      });

      ipcRenderer.send('getAppConfig');
    });
  };

  useEffect(() => {
    ipcRenderer.on('receiveNextRenderer', (nextRendererEvent, filePath) => {
      loadOrMove(filePath);
    });

    ipcRenderer.send('mainLoaded');

    window.addEventListener('mouseup', (event) => {
      if (event.button === 3 || event.button === 4) {
        event.preventDefault();
      }
    });

    return () => {
      ipcRenderer.removeAllListeners('receiveAppConfig');
      ipcRenderer.removeAllListeners('receiveNextRenderer');
    };
  }, []);

  return (
    <Layout center header={false}>
      <Grid
        item
        xs={12}
        css={css`
          text-align: center;
        `}
      >
        <CircularProgress size={80} thickness={6} />
        <Typography component="p" css={loadingText(theme)}>
          <strong>{t('loading')}</strong> ({t(`loading-${loadMsg}`)})
        </Typography>
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

export default connect(mapStateToProps, mapDispatchToProps)(Main);
