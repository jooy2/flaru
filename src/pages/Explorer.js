import React, { useState, useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  Grid, LinearProgress, List, ListItem, ListItemIcon, ListItemText, Paper, Typography,
} from '@material-ui/core';
import { useDropzone } from 'react-dropzone';
import { makeStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { PlayCircleOutline } from '@material-ui/icons';
import * as configActions from '../store/modules/config';

import Layout from '../components/layouts/Layout';
import AppAlert from '../components/views/AppAlert';

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  dropzone: {
    cursor: 'pointer',
    userSelect: 'none',
    padding: theme.spacing(3, 5),
    minHeight: '130px',
    textAlign: 'center',
    fontStyle: 'italic',
    borderRadius: '5px',
    border: theme.palette.type === 'light' ? '3px dashed #333' : '3px dashed #fff',
  },
  list: {
    '& .MuiListItemIcon-root': {
      minWidth: '32px',
    },
    '& span': {
      fontSize: '0.8em',
      maxWidth: '100%',
      overflowX: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
  mT: {
    marginTop: theme.spacing(2),
  },
}));

const Explorer = ({ ConfigActions, config }) => {
  const classes = useStyles();
  const [t] = useTranslation(['common', 'notice', 'menu']);
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [flashContentError, setFlashContentError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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
    history.push('/player');
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
    <Layout title={t('main-title')} withHelpButton>
      {!loading
      && (
      <>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <div {...getRootProps({ className: classes.dropzone })}>
              <Typography component="h2" variant="subtitle1">
                {t('notice:drag-drop-execute')}
              </Typography>
              <input {...getInputProps()} />
            </div>
            {flashContentError
            && (
            <Grid item xs={12}>
              <AppAlert
                severity="error"
                withMargin
                text={errorMessage}
              />
            </Grid>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
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
                <List component="nav" aria-label="recent files" dense className={classes.list}>
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
