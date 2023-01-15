/** @jsxImportSource @emotion/react */
import { useState, useCallback, useEffect, SetStateAction } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  Alert,
  Grid,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  ListItemButton,
  useTheme,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DeleteForever, FileOpen, PlayCircleOutline } from '@mui/icons-material';
import { css } from '@emotion/react';
import * as configActions from '../store/modules/config';

import Layout from '../components/layouts/Layout';
import { loadingText, paperSm } from '../utils/styles';

const Explorer = ({ ConfigActions, config }) => {
  const theme = useTheme();
  const [t] = useTranslation(['common', 'notice', 'menu']);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [flashContentError, setFlashContentError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { ipcRenderer } = window.require('electron');
  const runFlash = async (fileName, filePath) => {
    setLoading(true);
    await ConfigActions.setConfig({
      flashFileName: fileName || 'swf',
      flashFilePath: filePath,
      appConfigEmulatePlayerVersion: 0,
    });
    ipcRenderer.send('appendRecentFiles', filePath);
    navigate('/player');
    return true;
  };
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    const fileType = file?.type;
    const filePath = file?.path;
    const blob = fileType ? fileType.split('/')[1] : null;
    if (
      (!blob && !/\.(swf|dcr|dxr|dir)/.test(filePath)) ||
      (blob !== 'x-shockwave-flash' &&
        blob !== 'futuresplash' &&
        blob !== 'x-shockwave-flash2-preview' &&
        blob !== 'vnd.adobe.flash.movie' &&
        blob !== 'vnd.adobe.flash-movie')
    ) {
      setLoading(false);
      setFlashContentError(true);
      setErrorMessage(t('notice:wrong-file-type') as SetStateAction<string>);
      return false;
    }
    await runFlash(file?.name, filePath);
    return true;
  }, []);
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/x-shockwave-flash': ['.swf'],
    },
    multiple: false,
    onDrop,
    useFsAccessApi: false,
  });

  const handleClickRecentFile = async (ev, file) => {
    if (ev) ev.preventDefault();
    if (!file) return;
    ipcRenderer.send('checkFileExist', {
      name: file.split('\\').pop(),
      path: file,
    });
  };

  const handleRemoveRecentFiles = async () => {
    ipcRenderer.send('removeAllRecentFile');
    await ConfigActions.setConfig({
      recentFiles: [],
    });
  };

  useEffect(() => {
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
    <Layout header={!loading} center={loading} title={t('main-title') as string}>
      <Grid
        item
        xs={12}
        css={css`
          max-height: calc(100vh - 68px);
          overflow-y: auto;
        `}
      >
        <Grid container>
          {!loading && (
            <>
              <Grid item xs={12}>
                <Paper css={paperSm}>
                  <div
                    {...getRootProps({
                      css: css`
                        cursor: pointer;
                        user-select: none;
                        padding: 40px 35px;
                        min-height: 130px;
                        text-align: center;
                        font-style: italic;
                        border-radius: 15px;
                        border: ${config.isDarkTheme ? '3px dashed #fff' : '3px dashed #333'};
                        opacity: 0.8;
                        h2 {
                          margin: 10px 0;
                          font-size: 1.1em;
                        }
                        :hover {
                          opacity: 0.6;
                        }
                      `,
                    })}
                  >
                    <Typography component="h2" variant="subtitle1">
                      <strong>{t('notice:drag-drop-execute')}</strong>
                    </Typography>
                    <FileOpen fontSize="large" />
                    <input {...getInputProps()} />
                  </div>
                  {flashContentError && (
                    <Grid item xs={12}>
                      <Alert severity="error">{errorMessage}</Alert>
                    </Grid>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper css={paperSm}>
                  <Grid container justifyContent="space-between">
                    <Grid item xs={5}>
                      <Typography component="h2" variant="h6">
                        <strong>{t('common:recent-file-title')}</strong>
                      </Typography>
                    </Grid>
                    <Grid item>
                      <IconButton
                        onClick={handleRemoveRecentFiles}
                        disabled={config.recentFiles.length < 1}
                      >
                        <DeleteForever fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                  {config.recentFiles.length < 1 && (
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
                          {config.recentFiles.map((val) => (
                            <ListItem disablePadding key={val}>
                              <ListItemButton
                                component="a"
                                onClick={(e) => handleClickRecentFile(e, val)}
                              >
                                <ListItemIcon>
                                  <PlayCircleOutline />
                                </ListItemIcon>
                                <ListItemText primary={val} />
                              </ListItemButton>
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
          {loading && (
            <Grid
              item
              xs={12}
              css={css`
                text-align: center;
              `}
            >
              <CircularProgress size={80} thickness={6} />
              <Typography component="p" css={loadingText(theme)}>
                <strong>{t('player-loading')}</strong>
              </Typography>
            </Grid>
          )}
        </Grid>
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

export default connect(mapStateToProps, mapDispatchToProps)(Explorer);
