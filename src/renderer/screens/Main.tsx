/** @jsxImportSource @emotion/react */
import { useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTranslation } from 'react-i18next';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/react';
import Layout from '@/renderer/components/layouts/Layout';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';
import { loadingText } from '@/renderer/utils/styles';
import useTheme from '@mui/material/styles/useTheme';

const Main = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [t, i18n] = useTranslation(['common']);
  const [loadMsg, setLoadMsg] = useState(1);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const navigate = useNavigate();

  const handleVersionCheck = async () => true; // TODO version check

  const runFromExplorer = async (filePath: string): Promise<void> => {
    dispatch(
      setConfig({
        flashFileName: filePath.split('\\').pop(),
        flashFilePath: filePath,
      }),
    );
    window.mainApi.send('appendRecentFiles', filePath);
    navigate('/player');
  };

  const getLanguage = (): string => {
    if (i18n.languages && i18n.languages.length > 0) {
      if (i18n.languages[0] === 'auto') {
        return i18n.languages[1] || 'unknown';
      }
      return i18n.languages[0];
    }
    return 'unknown';
  };

  const loadOrMove = (filePath: string): void => {
    handleVersionCheck().then(async (result) => {
      if (!result) {
        return;
      }

      setLoadMsg(2);

      window.mainApi.receive('receiveAppConfig', async (appConfigEvent, configs) => {
        dispatch(
          setConfig({
            appConfigHideHeader: configs.hideHeader,
            appConfigTheme: configs.theme,
            appConfigHideContext: configs.hideContext,
            appConfigLetterbox: configs.letterbox,
            appConfigLanguage: configs.language,
            appConfigCurrentLanguage: getLanguage(),
            appConfigRestoreWindowBounds: configs.restoreWindowBounds,
            appConfigAdjustOriginalSize: configs.adjustOriginalSize,
            appConfigShowPlayerVersionSelect: configs.showPlayerVersionSelect,
            appConfigShowPlayerController: configs.showPlayerController,
            appConfigPreferredRenderer: configs.preferredRenderer,
            appConfigQuality: configs.quality,
          }),
        );

        if (configs.theme === 'auto') {
          dispatch(
            setConfig({
              appConfigTheme: 'auto',
              isDarkTheme: prefersDarkMode,
            }),
          );
        } else {
          dispatch(
            setConfig({
              appConfigTheme: configs.theme,
              isDarkTheme: configs.theme !== 'light',
            }),
          );
        }

        if (configs.language !== 'auto') {
          await i18n.changeLanguage(configs.language);
        }

        window.mainApi.receive('receiveOpenFile', async (openFileEvent, receivePath) => {
          await runFromExplorer(receivePath);
        });

        setLoadMsg(3);

        if (filePath) {
          await runFromExplorer(filePath);
        } else {
          navigate('/explorer');
        }
      });

      window.mainApi.send('getAppConfig');
    });
  };

  const getGlobalValueForMain = async () => {
    dispatch(
      setConfig({
        mainGlobalValues: await window.mainApi.getGlobalValues(),
      }),
    );
  };

  useEffect(() => {
    getGlobalValueForMain().then(() => {
      window.mainApi.receive('receiveNextRenderer', (nextRendererEvent, filePath) => {
        loadOrMove(filePath);
      });

      window.mainApi.send('mainLoaded');

      window.addEventListener('mouseup', (event) => {
        if (event.button === 3 || event.button === 4) {
          event.preventDefault();
        }
      });
    });

    return () => {
      window.mainApi.removeListener('receiveAppConfig');
      window.mainApi.removeListener('receiveNextRenderer');
    };
  }, []);

  return (
    <Layout center header={false}>
      <Grid
        item
        xs={12}
        css={css`
          text-align: center;
        `}
      >
        <CircularProgress size={80} thickness={6} />
        <Typography component="p" css={loadingText(theme)}>
          <strong>{t('loading')}</strong> ({t(`loading-${loadMsg}`)})
        </Typography>
      </Grid>
    </Layout>
  );
};

export default Main;
