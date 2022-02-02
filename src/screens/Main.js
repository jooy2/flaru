/** @jsxImportSource @emotion/react */
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  Grid, LinearProgress, Typography, useMediaQuery,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { useNavigate } from 'react-router-dom';
import * as configActions from '../store/modules/config';
import Layout from '../components/layouts/Layout';
import { generateUid } from '../utils/tracking';

const Main = ({ ConfigActions }) => {
  const [t, i18n] = useTranslation(['common']);
  const [loadMsg, setLoadMsg] = useState(1);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const navigate = useNavigate();
  const electron = window.require('electron');
  const { ipcRenderer } = electron;

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
      if (i18n.languages[0] === 'auto') return i18n.languages[1] || 'unknown';
      return i18n.languages[0];
    }
    return 'unknown';
  };

  const loadOrMove = (filePath) => {
    handleVersionCheck().then(async (result) => {
      if (!result) return;
      setLoadMsg(3);
      ipcRenderer.on('receiveAppConfig', async (appConfigEvent, configs) => {
        const uid = configs.uid || await generateUid();
        await ConfigActions.setConfig({
          appConfigHideHeader: configs.hideHeader,
          appConfigTheme: configs.theme,
          appConfigHideContext: configs.hideContext,
          appConfigLetterbox: configs.letterbox,
          appConfigLanguage: configs.language,
          appConfigCurrentLanguage: getLanguage(),
          appConfigRestoreWindowBounds: configs.restoreWindowBounds,
          appConfigAdjustOriginalSize: configs.adjustOriginalSize,
          appConfigUid: uid,
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
        if (configs.language !== 'auto') await i18n.changeLanguage(configs.language);
        ipcRenderer.on('receiveOpenFile', async (openFileEvent, receivePath) => {
          await runFromExplorer(receivePath);
        });
        setLoadMsg(4);
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

    return () => {
      ipcRenderer.removeAllListeners('receiveAppConfig');
      ipcRenderer.removeAllListeners('receiveNextRenderer');
    };
  }, []);

  return (
    <Layout header={false}>
      <Grid item xs={12}>
        <LinearProgress />
        <Typography component="p">
          <strong>{t('loading')}</strong>
          {' '}
          (
          {t(`loading-${loadMsg}`)}
          )
        </Typography>
      </Grid>
    </Layout>
  );
};

const mapStateToProps = state => ({
  config: state.config,
});

const mapDispatchToProps = dispatch => ({
  ConfigActions: bindActionCreators({ ...configActions }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Main);
