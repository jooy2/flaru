/** @jsxImportSource @emotion/react */
import React from 'react';
import {
  Button,
  Grid, Paper, Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { Article, Update } from '@mui/icons-material';
import Layout from '../components/layouts/Layout';
import { getVersionName, goToExtLink } from '../utils/helper';
import { paperBase } from '../utils/styles';

const About = () => {
  const [t] = useTranslation(['common', 'notice', 'menu']);

  return (
    <Layout
      title={t('about-title')}
      withBackButton
    >
      <Grid item xs={12}>
        <Paper css={paperBase}>
          <Typography component="h2" variant="h5">OpenRuffle Player</Typography>
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

export default About;
