import { useEffect, useState } from 'react';
import { MPProgressCircular, MPTypography } from 'material-plus-ui';
import { useMPMediaQuery } from 'material-plus-ui/hooks';
import { useTranslation } from 'react-i18next';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '@/renderer/components/layouts/Layout';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';

export default function Main() {
  const dispatch = useDispatch();
  const [t, i18n] = useTranslation(['common']);
  const [loadMsg, setLoadMsg] = useState(1);
  const prefersDarkMode = useMPMediaQuery('(prefers-color-scheme: dark)');
  const navigate = useNavigate();

  const handleVersionCheck = async () => true; // TODO version check

  const runFromExplorer = async (filePath: string): Promise<void> => {
    dispatch(
      setConfig({
        flashFileName: await window.mainApi.getFileNameFromPath(filePath, true),
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
            appConfigLetterboxMode: configs.letterboxMode,
            appConfigLanguage: configs.language,
            appConfigCurrentLanguage: getLanguage(),
            appConfigRestoreWindowBounds: configs.restoreWindowBounds,
            appConfigAdjustOriginalSize: configs.adjustOriginalSize,
            appConfigShowPlayerVersionSelect: configs.showPlayerVersionSelect,
            appConfigShowPlayerController: configs.showPlayerController,
            appConfigPreferredRenderer: configs.preferredRenderer,
            appConfigQuality: configs.quality,
            appConfigPlayerRuntime: configs.playerRuntime,
            appConfigDeviceFontRenderer: configs.deviceFontRenderer,
            appConfigScale: configs.scale,
            appConfigForceScale: configs.forceScale,
            appConfigAllowFullscreen: configs.allowFullscreen,
            appConfigPauseInBackground: configs.pauseInBackground,
            appConfigMaxExecutionDuration: configs.maxExecutionDuration,
            appConfigHardwareAcceleration: configs.hardwareAcceleration,
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

        window.mainApi.receive('receiveOpenFile', (openFileEvent, receivePath) => {
          runFromExplorer(receivePath);
        });

        setLoadMsg(3);

        if (filePath) {
          runFromExplorer(filePath);
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
      <div className="app-loading">
        <MPProgressCircular size="xl" />
        <MPTypography className="app-loading__text" level="body">
          <strong>{t('loading')}</strong> ({t(`loading-${loadMsg}`)})
        </MPTypography>
      </div>
    </Layout>
  );
}
