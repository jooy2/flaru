/** @jsxImportSource @emotion/react */
import React from 'react';
import {
  Button,
  Grid, Paper, Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { Update } from '@mui/icons-material';
import Layout from '../components/layouts/Layout';
import { getRuffleVersion, getVersionName, goToExtLink } from '../utils/helper';
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
            {getVersionName()}
          </Typography>
          <Typography component="p" variant="body1">
            Made By jooy2 (jootc.help@gmail.com)
          </Typography>
          <Typography component="p" variant="body1">
            Player Based on Ruffle Flash Emulator (
            {getRuffleVersion()}
            )
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
          <Typography component="h2" variant="h5">LICENSE</Typography>
          <Typography component="h2" variant="subtitle1">
            <strong>Ruffle By Mike Welsh (Web Based Adobe Flash Player)</strong>
            <hr />
          </Typography>
          <Typography component="p" variant="body1">
            Copyright (c) 2018 Mike Welsh &lt;mwelsh@gmail.com&gt;
            <br />
            <br />
            Permission is hereby granted, free of charge, to any
            <br />
            person obtaining a copy of this software and associated
            <br />
            documentation files (the &ldquo;Software&rdquo;), to deal in the
            <br />
            Software without restriction, including without
            <br />
            limitation the rights to use, copy, modify, merge,
            <br />
            publish, distribute, sublicense, and/or sell copies of
            <br />
            the Software, and to permit persons to whom the Software
            <br />
            is furnished to do so, subject to the following
            <br />
            conditions:
            <br />
            <br />
            The above copyright notice and this permission notice
            <br />
            shall be included in all copies or substantial portions
            <br />
            of the Software.
            <br />
            <br />
            THE SOFTWARE IS PROVIDED &ldquo;AS IS&rdquo;, WITHOUT WARRANTY OF
            <br />
            ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
            <br />
            TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            <br />
            PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
            <br />
            SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
            <br />
            CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
            <br />
            OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
            <br />
            IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
            <br />
            DEALINGS IN THE SOFTWARE.
          </Typography>
        </Paper>
      </Grid>
    </Layout>
  );
};

export default About;
