/** @jsxImportSource @emotion/react */
import { useMemo } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import Article from '@mui/icons-material/Article';
import Update from '@mui/icons-material/Update';
import { css } from '@emotion/react';
import Layout from '@/renderer/components/layouts/Layout';
import { openExternalLink } from '@/renderer/utils/helper';
import { paperBase } from '@/renderer/utils/styles';
import { useSelector } from 'react-redux';
import { RootState } from '@/renderer/store';

const About = () => {
  const [t] = useTranslation(['common', 'notice', 'menu']);
  const stateAppScreen = useSelector((state: RootState) => state.appScreen);
  const ruffleVersion = useMemo(() => stateAppScreen.mainGlobalValues.APP_RUFFLE_VERSION_DATE, []);
  const author = useMemo(() => stateAppScreen.mainGlobalValues.APP_AUTHOR, []);

  return (
    <Layout title={t('about-title') as string} withBackButton>
      <Grid item xs={12}>
        <Paper css={paperBase}>
          <img
            css={css`
              max-width: 350px;
              height: auto;
            `}
            draggable="false"
            alt="logo"
            src="images/flaru-logo.webp"
          />
          <Typography component="p" variant="body1">
            Flaru {stateAppScreen.mainGlobalValues.APP_VERSION_NAME} By {author}
          </Typography>
          <Typography component="p" variant="body1">
            Flash Emulator Based on Ruffle (Nightly {ruffleVersion})
          </Typography>
          <Typography component="p" variant="body1">
            <Button
              startIcon={<Article />}
              onClick={(ev) =>
                openExternalLink(ev, 'https://github.com/ruffle-rs/ruffle/blob/master/LICENSE.md')
              }
            >
              Ruffle LICENSE
            </Button>
            <Button
              startIcon={<Update />}
              onClick={(ev) => openExternalLink(ev, 'https://github.com/jooy2/flaru/releases')}
            >
              {t('menu:update-check')}
            </Button>
          </Typography>
        </Paper>
      </Grid>
    </Layout>
  );
};

export default About;
