// The Ruffle player is a custom element created by the Ruffle runtime and driven
// imperatively, so it is mutated in place instead of being replaced through state.
/* eslint-disable react-hooks/immutability, react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/renderer/store';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';
import { MPIcon, MPIconButton, MPSlider, MPTooltip } from 'material-plus-ui';
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ModalConfirm from '@/renderer/components/dialogs/ModalConfirm';

export default function FlashPlayer({
  url = '',
  autoplay = true,
  filePath = '',
  header = true,
}: {
  url?: string;
  autoplay?: boolean;
  filePath?: string;
  header?: boolean;
}) {
  const [t] = useTranslation(['menu']);
  const navigate = useNavigate();
  const player: any = useRef(null);
  const [rufflePlayer, setRufflePlayer]: any = useState(null);
  const [openFailedToLoadServerModal, setOpenFailedToLoadServerModal] = useState(false);
  const dispatch = useDispatch();
  const stateAppScreen = useSelector((state: RootState) => state.appScreen);
  const [currentFileName, setCurrentFileName] = useState('');
  const [currentFileDirectory, setCurrentFileDirectory] = useState('');

  const handlePauseOrPlay = () => {
    if (!rufflePlayer) {
      return;
    }

    if (rufflePlayer.isPlaying) {
      rufflePlayer.pause();
    } else {
      rufflePlayer.play();
    }
  };

  const handleMute = () => {
    if (stateAppScreen.flashVolume === 0) {
      rufflePlayer.volume = 1;
      dispatch(setConfig({ flashVolume: 100 }));
    } else {
      rufflePlayer.volume = 0;
      dispatch(setConfig({ flashVolume: 0 }));
    }
  };

  const handleVolumeSliderChange = (newValue) => {
    const volume = Array.isArray(newValue) ? newValue[0] : newValue;
    rufflePlayer.volume = volume / 100;
    dispatch(setConfig({ flashVolume: volume }));
  };

  const handleBack = () => {
    navigate('/explorer');
  };

  const loadFlash = () => {
    window.mainApi.startStaticServer(currentFileDirectory).then((port) => {
      if (!port) {
        setOpenFailedToLoadServerModal(true);
        return;
      }

      rufflePlayer.ruffle().load({
        url: `http://localhost:${port}/${currentFileName}`,
        autoplay: autoplay ? 'on' : 'off',
        base: currentFileDirectory,
        allowScriptAccess: true,
        letterbox: stateAppScreen.appConfigLetterbox ? 'on' : 'off',
        contextMenu: stateAppScreen.appConfigHideContext ? 'off' : 'on',
        logLevel: 'error',
        openUrlMode: 'confirm',
        preferredRenderer:
          stateAppScreen.appConfigPreferredRenderer === 'auto'
            ? null
            : stateAppScreen.appConfigPreferredRenderer,
        quality: stateAppScreen.appConfigQuality,
        playerRuntime: stateAppScreen.appConfigPlayerRuntime,
        warnOnUnsupportedContent: false,
        playerVersion:
          stateAppScreen.appConfigEmulatePlayerVersion === 0
            ? null
            : stateAppScreen.appConfigEmulatePlayerVersion,
      });
      rufflePlayer.addEventListener('oncontextmenu', (e) => e.preventDefault());
    });
  };

  const getFileName = async () => {
    const fileName = await window.mainApi.getFileNameFromPath(
      filePath.replace('file:///', ''),
      true,
    );
    const dirName = await window.mainApi.getDirnameFromPath(filePath);

    setCurrentFileName(fileName);
    setCurrentFileDirectory(dirName);
  };

  useEffect(() => {
    getFileName().then(() => {
      const ruffle = window.RufflePlayer.newest();
      setRufflePlayer(ruffle.createPlayer());
    });
  }, [url, filePath]);

  useEffect((): any => {
    const container = player.current;
    container.innerHTML = '';

    window.RufflePlayer = window.RufflePlayer || {};
    window.RufflePlayer.config = {
      polyfills: false,
      showSwfDownload: false,
      splashScreen: false,
    };

    if (!rufflePlayer) {
      return;
    }

    rufflePlayer.id = 'player';
    rufflePlayer.addEventListener('loadedmetadata', () => {
      const metaData = rufflePlayer?.metadata;
      dispatch(
        setConfig({
          flashFileSwfVer: metaData?.swfVersion,
          flashFileFrame: metaData?.numFrames,
          flashFileAs3: metaData?.isActionScript3,
          flashFileWidth: metaData?.width,
          flashFileHeight: metaData?.height,
          flashFileBackgroundColor: metaData?.backgroundColor,
          flashFileFrameRate: metaData?.frameRate,
        }),
      );
      if (stateAppScreen.appConfigAdjustOriginalSize && metaData?.width && metaData?.height) {
        window.mainApi.send('resizeWindow', {
          width: metaData.width,
          height: metaData.height,
        });
      }
    });

    container.appendChild(rufflePlayer);
    loadFlash();
  }, [url, filePath, stateAppScreen.appConfigEmulatePlayerVersion, rufflePlayer]);

  return (
    <>
      <div style={{ height: header ? 'calc(100vh - 40px)' : '100vh' }}>
        <div
          id="main"
          className="app-player__stage"
          style={{
            height: `calc(100% - ${stateAppScreen.appConfigShowPlayerController ? 42 : 0}px)`,
          }}
          ref={player}
          onContextMenu={(e) => e.preventDefault()}
        />
        {stateAppScreen.appConfigShowPlayerController && (
          <div className="app-player__controller">
            <MPIconButton
              variant="text"
              color="primary"
              label="player-pause-and-play"
              onClick={handlePauseOrPlay}
              icon={<MPIcon icon={rufflePlayer?.isPlaying ? Pause : Play} size={18} />}
            />
            <MPTooltip content={t('replay')}>
              <MPIconButton
                variant="text"
                label="player-replay"
                onClick={loadFlash}
                icon={<MPIcon icon={RotateCcw} size={18} />}
              />
            </MPTooltip>
            <div className="app-player__volume">
              <MPIconButton
                variant="text"
                label="player-mute"
                onClick={handleMute}
                icon={
                  <MPIcon icon={stateAppScreen.flashVolume === 0 ? VolumeX : Volume2} size={18} />
                }
              />
              <MPSlider
                className="app-player__volume-slider"
                aria-label="player-volume"
                value={stateAppScreen.flashVolume}
                onValueChange={handleVolumeSliderChange}
              />
            </div>
          </div>
        )}
      </div>
      <ModalConfirm
        noCancel
        content={t('notice:failed-to-load-server')}
        open={openFailedToLoadServerModal}
        onCancel={() => null}
        onClose={handleBack}
        onOk={handleBack}
      />
    </>
  );
}
