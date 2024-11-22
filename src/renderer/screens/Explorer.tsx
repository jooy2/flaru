/** @jsxImportSource @emotion/react */
import { useState, useCallback, useEffect, SetStateAction } from 'react';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DeleteForever from '@mui/icons-material/DeleteForever';
import FileOpen from '@mui/icons-material/FileOpen';
import PlayCircleOutline from '@mui/icons-material/PlayCircleOutline';
import { css } from '@emotion/react';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/renderer/store';
import Layout from '@/renderer/components/layouts/Layout';
import { loadingText, paperSm } from '@/renderer/utils/styles';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';
import useTheme from '@mui/material/styles/useTheme';

const Explorer = () => {
  const dispatch = useDispatch();
  const stateAppScreen = useSelector((state: RootState) => state.appScreen);
  const theme = useTheme();
  const [t] = useTranslation(['common', 'notice', 'menu']);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [flashContentError, setFlashContentError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const runFlash = (fileName: string, filePath: string) => {
    setLoading(true);
    dispatch(
      setConfig({
        flashFileName: fileName || 'swf',
        flashFilePath: filePath,
        appConfigEmulatePlayerVersion: 0,
      }),
    );
    window.mainApi.send('appendRecentFiles', filePath);
    navigate('/player');
    return true;
  };
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    const fileType = file?.type;
    const filePath = window.mainApi.showFilePath(file);
    const blob = fileType ? fileType.split('/')[1] : null;
    if (
      (!blob && !/\.(swf)/.test(filePath)) ||
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

    runFlash(file?.name, filePath);

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
    window.mainApi.send('checkFileExist', {
      name: file.split('\\').pop(),
      path: file,
    });
  };

  const handleRemoveRecentFiles = () => {
    window.mainApi.send('removeAllRecentFile');
    dispatch(
      setConfig({
        recentFiles: [],
      }),
    );
  };

  useEffect(() => {
    window.mainApi.receive('receiveRecentFiles', async (event, argument) => {
      dispatch(
        setConfig({
          recentFiles: argument,
        }),
      );
    });

    window.mainApi.receive('receiveFileExist', async (event, argument) => {
      if (argument.exist) {
        runFlash(argument.name, argument.path);
      } else {
        window.mainApi.send('removeRecentFile', {
          path: argument.path,
          title: t('common:dialog-title-info'),
          message: t('notice:not-found-recent-file'),
        });
      }
    });

    window.mainApi.send('getRecentFiles');

    return () => {
      window.mainApi.removeListener('receiveRecentFiles');
      window.mainApi.removeListener('receiveFileExist');
    };
  }, []);

  return (
    <Layout header={!loading} center={loading} title={t('main-title') as string}>
      <Grid
        size={12}
        css={css`
          max-height: calc(100vh - 68px);
          overflow-y: auto;
        `}
      >
        <Grid container>
          {!loading && (
            <>
              <Grid size={12}>
                <Paper css={paperSm}>
                  <div
                    data-testid="uiFileOpen"
                    {...getRootProps({
                      css: css`
                        cursor: pointer;
                        user-select: none;
                        padding: 40px 35px;
                        min-height: 130px;
                        text-align: center;
                        font-style: italic;
                        border-radius: 15px;
                        border: ${stateAppScreen.isDarkTheme
                          ? '3px dashed #fff'
                          : '3px dashed #333'};
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
                    <Grid size={12}>
                      <Alert severity="error">{errorMessage}</Alert>
                    </Grid>
                  )}
                </Paper>
              </Grid>
              <Grid size={12}>
                <Paper css={paperSm}>
                  <Grid container justifyContent="space-between">
                    <Grid size={5}>
                      <Typography component="h2" variant="h6">
                        <strong>{t('common:recent-file-title')}</strong>
                      </Typography>
                    </Grid>
                    <Grid>
                      <IconButton
                        onClick={handleRemoveRecentFiles}
                        disabled={stateAppScreen.recentFiles.length < 1}
                      >
                        <DeleteForever fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                  {stateAppScreen.recentFiles.length < 1 && (
                    <Typography component="p" variant="subtitle2">
                      {t('notice:no-recent-files')}
                    </Typography>
                  )}
                  {stateAppScreen.recentFiles.length > 0 && (
                    <Grid container>
                      <Grid size={12}>
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
                          {stateAppScreen.recentFiles.map((val) => (
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
              size={12}
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

export default Explorer;
