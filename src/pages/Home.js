import React, {
  useState, useCallback,
} from 'react';
import {
  Grid, LinearProgress, Paper, Typography,
} from '@material-ui/core';
import { useDropzone } from 'react-dropzone';
import { makeStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';

import Layout from '../components/layouts/Layout';
import FlashPlayer from '../components/player/FlashPlayer';
import AppMenu from '../components/layouts/AppMenu';
import AppAlert from '../components/views/AppAlert';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(1, 0),
  },
  paper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  dropzone: {
    cursor: 'pointer',
    userSelect: 'none',
    padding: theme.spacing(3, 5),
    minHeight: '280px',
    textAlign: 'center',
    fontStyle: 'italic',
    borderRadius: '5px',
    border: theme.palette.type === 'light' ? '3px dashed #333' : '3px dashed #fff',
  },
}));

const Home = () => {
  const classes = useStyles();
  const [t] = useTranslation(['common', 'notice', 'menu']);
  const [filePath, setFilePath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flashContentError, setFlashContentError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const onDrop = useCallback(async acceptedFiles => {
    const file = acceptedFiles[0];
    const fileType = file?.type;
    const uploadFilePath = file?.path;
    const blob = fileType ? fileType.split('/')[1] : null;
    if (blob !== 'x-shockwave-flash'
        && blob !== 'futuresplash'
        && blob !== 'x-shockwave-flash2-preview'
        && blob !== 'vnd.adobe.flash-movie') {
      setFlashContentError(true);
      setErrorMessage(t('notice:wrong-file-type'));
      return false;
    }
    setLoading(true);
    setFilePath(uploadFilePath);
    setLoading(false);
    return true;
  }, []);
  const { getRootProps, getInputProps } = useDropzone({
    accept: '.swf',
    multiple: false,
    onDrop,
  });

  return (
    <Layout
      title={filePath ? t('player-title') : t('main-title')}
      withTail={!filePath}
      withBackButton={filePath}
      withHelpButton={!filePath}
      container={!filePath}
    >
      <div className={filePath ? {} : classes.root}>
        {!filePath && !loading
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
                <AppMenu />
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
        {!loading && filePath
            && (
            <Grid item xs={12}>
              <FlashPlayer
                filePath={filePath}
              />
            </Grid>
            )}
      </div>
    </Layout>
  );
};

export default Home;
