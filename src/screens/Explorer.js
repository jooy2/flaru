/** @jsxImportSource @emotion/react */
import React, { useState, useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  Alert,
  Button,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Grid, LinearProgress, List, ListItem, ListItemIcon, ListItemText, Paper, Typography,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PlayCircleOutline } from '@mui/icons-material';
import { css } from '@emotion/react';
import * as configActions from '../store/modules/config';

import Layout from '../components/layouts/Layout';
import { paperSm, userSelectNone } from '../utils/styles';

const Explorer = ({ ConfigActions, config }) => {
  const [t] = useTranslation(['common', 'notice', 'menu']);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [flashContentError, setFlashContentError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [as3DialogOpen, setAs3DialogOpen] = useState(false);
  const electron = window.require('electron');
  const { ipcRenderer } = electron;
  const runFlash = async (fileName, filePath) => {
    setLoading(true);
    await ConfigActions.setConfig({
      isPlaying: true,
      flashFileName: fileName || 'swf',
      flashFilePath: filePath,
    });
    ipcRenderer.send('appendRecentFiles', filePath);
    navigate('/player');
    return true;
  };
  const onDrop = useCallback(async acceptedFiles => {
    const file = acceptedFiles[0];
    const fileType = file?.type;
    const filePath = file?.path;
    const blob = fileType ? fileType.split('/')[1] : null;
    if (blob !== 'x-shockwave-flash'
          && blob !== 'futuresplash'
          && blob !== 'x-shockwave-flash2-preview'
          && blob !== 'vnd.adobe.flash.movie'
          && blob !== 'vnd.adobe.flash-movie') {
      setFlashContentError(true);
      setErrorMessage(t('notice:wrong-file-type'));
      return false;
    }
    await runFlash(file?.name, filePath);
    return true;
  }, []);
  const { getRootProps, getInputProps } = useDropzone({
    accept: '.swf',
    multiple: false,
    onDrop,
  });

  const handleClickRecentFile = async (ev, file) => {
    if (ev) ev.preventDefault();
    if (!file) return;
    ipcRenderer.send('checkFileExist', {
      name: file.split('\\').pop(),
      path: file,
    });
  };

  const handleAS3ErrorClose = async () => {
    await ConfigActions.setConfig({ isAS3Error: false });
    setAs3DialogOpen(false);
  };

  useEffect(() => {
    if (config.isAS3Error && !as3DialogOpen) {
      setAs3DialogOpen(true);
    }

    ipcRenderer.on('receiveRecentFiles', async (event, argument) => {
      await ConfigActions.setConfig({
        recentFiles: argument,
      });
    });

    ipcRenderer.on('receiveFileExist', async (event, argument) => {
      if (argument.exist) {
        await runFlash(argument.name, argument.path);
      } else {
        ipcRenderer.send('removeRecentFile', {
          path: argument.path,
          title: t('common:dialog-title-info'),
          message: t('notice:not-found-recent-file'),
        });
      }
    });

    ipcRenderer.send('getRecentFiles');

    return () => {
      ipcRenderer.removeAllListeners('receiveRecentFiles');
      ipcRenderer.removeAllListeners('receiveFileExist');
    };
  }, []);

  return (
    <Layout title={t('main-title')} withHelpButton>
      {!loading
      && (
      <>
        <Grid item xs={12}>
          <Paper css={paperSm}>
            <div {...getRootProps({
              css: css`
                cursor: pointer;
                user-select: none;
                padding: 24px 40px;
                min-height: 130px;
                text-align: center;
                font-style: italic;
                border-radius: 5px;
                border: ${config.isDarkTheme ? '3px dashed #fff' : '3px dashed #333'};
              `,
            })}
            >
              <Typography component="h2" variant="subtitle1">
                {t('notice:drag-drop-execute')}
              </Typography>
              <input {...getInputProps()} />
            </div>
            {flashContentError
            && (
            <Grid item xs={12}>
              <Alert severity="error">{errorMessage}</Alert>
            </Grid>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper css={paperSm}>
            <Typography component="h2" variant="h6">
              <strong>{t('common:recent-file-title')}</strong>
            </Typography>
            {config.recentFiles.length < 1
            && (
            <Typography component="p" variant="subtitle2">
              {t('notice:no-recent-files')}
            </Typography>
            )}
            {config.recentFiles.length > 0 && (
            <Grid container>
              <Grid item xs={12}>
                <List
                  component="nav"
                  aria-label="recent files"
                  dense
                  css={css`
                    .MuiListItemIcon-root {
                      min-width: 32px;
                    }
                    span {
                      font-size: 0.8em;
                      max-width: 100%;
                      overflow-x: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    }
                  `}
                >
                  {config.recentFiles.map(val => (
                    <ListItem button key={val} onClick={(e) => handleClickRecentFile(e, val)}>
                      <ListItemIcon>
                        <PlayCircleOutline />
                      </ListItemIcon>
                      <ListItemText primary={val} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
            )}
          </Paper>
        </Grid>
      </>
      )}
      {loading
      && (
      <Grid item xs={12}>
        <LinearProgress />
        {t('player-loading')}
      </Grid>
      )}
      <Dialog
        css={userSelectNone}
        open={as3DialogOpen}
        onClose={handleAS3ErrorClose}
        disableEscapeKeyDown
        aria-labelledby="error-title"
        aria-describedby="error-desc"
      >
        <DialogTitle id="error-title">
          ⛔
          {' '}
          <strong>{t('notice:as3-alert-title')}</strong>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="error-desc">
            {t('notice:as3-alert-desc')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={e => handleAS3ErrorClose(e)} color="primary">
            {t('menu:close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

const mapStateToProps = state => ({
  config: state.config,
});

const mapDispatchToProps = dispatch => ({
  ConfigActions: bindActionCreators({ ...configActions }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Explorer);
