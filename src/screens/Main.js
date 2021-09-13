/** @jsxImportSource @emotion/react */
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  Grid, LinearProgress, Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { useHistory } from 'react-router-dom';
import * as configActions from '../store/modules/config';
import Layout from '../components/layouts/Layout';

const Main = ({ ConfigActions }) => {
  const [t] = useTranslation(['common']);
  const history = useHistory();
  const electron = window.require('electron');
  const { ipcRenderer } = electron;

  const runFromExplorer = async (filePath) => {
    await ConfigActions.setConfig({
      flashFileName: filePath.split('\\').pop(),
      flashFilePath: filePath,
    });
    ipcRenderer.send('appendRecentFiles', filePath);
    history.push('/player');
  };

  const loadOrMove = (filePath) => {
    ipcRenderer.on('receiveAppConfig', async () => {
      ipcRenderer.on('receiveOpenFile', async (openFileEvent, receivePath) => {
        await runFromExplorer(receivePath);
      });
      if (filePath) {
        await runFromExplorer(filePath);
      } else {
        history.push('/explorer');
      }
    });
    ipcRenderer.send('getAppConfig');
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
        </Typography>
      </Grid>
    </Layout>
  );
};

const mapDispatchToProps = dispatch => ({
  ConfigActions: bindActionCreators({ ...configActions }, dispatch),
});

export default connect(null, mapDispatchToProps)(Main);
