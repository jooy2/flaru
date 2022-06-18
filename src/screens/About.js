/** @jsxImportSource @emotion/react */
import React, { useMemo } from 'react';
import {
  Button,
  Grid, Paper, Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { Article, Update } from '@mui/icons-material';
import { css } from '@emotion/react';
import { connect } from 'react-redux';
import Layout from '../components/layouts/Layout';
import { getRuffleVersion, getVersionName, goToExtLink } from '../utils/helper';
import { paperBase } from '../utils/styles';

const About = ({ config }) => {
  const [t] = useTranslation(['common', 'notice', 'menu']);
  const ruffleVersion = useMemo(() => getRuffleVersion(), []);

  return (
    <Layout
      title={t('about-title')}
      withBackButton
    >
      <Grid item xs={12}>
        <Paper css={[paperBase, config.isDarkTheme ? css`background: #4a4a4a` : []]}>
          <img draggable="false" alt="logo" src={`${process.env.PUBLIC_URL}/images/open-ruffle-player-logo.png`} />
          <Typography component="p" variant="body1">
            By jooy2 (jootc.help@gmail.com)
          </Typography>
          <Typography component="p" variant="body1">
            {getVersionName()}
          </Typography>
          <Typography component="p" variant="body1">
            <Button
              startIcon={<Update />}
              onClick={(ev) => goToExtLink(ev, 'https://github.com/jooy2/open-ruffle-player/releases')}
            >
              {t('menu:update-check')}
            </Button>
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper css={paperBase}>
          <Typography component="h3" variant="h5">
            Emulator Based on:
          </Typography>
          <Typography component="p" variant="body1">
            <img draggable="false" alt="logo" src={`${process.env.PUBLIC_URL}/images/ruffle-logo.png`} />
          </Typography>
          <Typography component="p" variant="body1">
            {ruffleVersion}
          </Typography>
          <Typography component="p" variant="body1">
            <Button
              startIcon={<Article />}
              onClick={(ev) => goToExtLink(ev, 'https://github.com/ruffle-rs/ruffle/blob/master/LICENSE.md')}
            >
              {t('menu:view-license')}
            </Button>
          </Typography>
        </Paper>
      </Grid>
    </Layout>
  );
};

const mapStateToProps = state => ({
  config: state.config,
});

export default connect(mapStateToProps)(About);
