// The Ruffle player is a custom element created by the Ruffle runtime and driven
// imperatively, so it is mutated in place instead of being replaced through state.
/* eslint-disable react-hooks/immutability, react-hooks/set-state-in-effect */
import { useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/renderer/store';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';
import {
  MPCheckbox,
  MPIcon,
  MPIconButton,
  MPPane,
  MPPanes,
  MPPopover,
  MPSlider,
  MPTooltip,
} from 'material-plus-ui';
import { Mouse, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ModalConfirm from '@/renderer/components/dialogs/ModalConfirm';
import PlayerLogPanel from '@/renderer/components/views/PlayerLogPanel';
import PlayerVirtualMousePad from '@/renderer/components/views/PlayerVirtualMousePad';
import useRuffleLog from '@/renderer/hooks/useRuffleLog';
import { toRuffleLogLevel } from '@/renderer/utils/ruffleLog';

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
  const [showVirtualMouse, setShowVirtualMouse] = useState(false);
  const dispatch = useDispatch();
  const stateAppScreen = useSelector((state: RootState) => state.appScreen);
  const [currentFileName, setCurrentFileName] = useState('');
  const [currentFileDirectory, setCurrentFileDirectory] = useState('');
  // The movie's listeners outlive the render that added them, so they read the
  // option from here instead of from the state they were created with.
  const adjustOriginalSizeRef = useRef(stateAppScreen.appConfigAdjustOriginalSize);
  const contextMenuMode = stateAppScreen.appConfigHideContext ? 'off' : 'on';
  const backgroundExecutionMode = stateAppScreen.appConfigPauseInBackground ? 'none' : 'mainThread';
  const isSilent = stateAppScreen.flashMuted || stateAppScreen.flashVolume === 0;
  // A run without hardware acceleration has no WebGL, and the automatic choice
  // tries the GPU renderers first, which some Ruffle versions do not come back
  // from. So it draws on a canvas, unless a renderer was chosen by hand.
  const autoRenderer = stateAppScreen.mainGlobalValues.ENV_HARDWARE_ACCELERATION ? null : 'canvas';
  // Ruffle tells nothing when it pauses or resumes, so the controls are drawn
  // again by hand after each change.
  const [, redrawControls] = useReducer((count: number) => count + 1, 0);
  const ruffleLog = useRuffleLog();
  // Whether the game was paused for a dialog, so closing it resumes only a game
  // that was running when it opened.
  const pausedForDialogRef = useRef(false);
  // The dialogs the header opens cover the movie, so the game waits under them.
  const isCoveredByDialog =
    stateAppScreen.dialogSettingsOpen ||
    stateAppScreen.dialogAboutOpen ||
    stateAppScreen.dialogMetadataOpen;

  const resizeWindowToMovie = (metaData) => {
    if (metaData?.width && metaData?.height) {
      window.mainApi.send('resizeWindow', {
        width: metaData.width,
        height: metaData.height,
      });
    }
  };

  const handlePauseOrPlay = () => {
    if (!rufflePlayer) {
      return;
    }

    if (rufflePlayer.isPlaying) {
      rufflePlayer.pause();
    } else {
      rufflePlayer.play();
    }

    redrawControls();
  };

  const handleMuteChange = (muted: boolean) => {
    if (!rufflePlayer) {
      return;
    }

    rufflePlayer.volume = muted ? 0 : stateAppScreen.flashVolume / 100;
    dispatch(setConfig({ flashMuted: muted }));
    window.mainApi.send('setAppConfig', { playerMuted: muted });
  };

  const handleVolumeSliderChange = (value: number | readonly number[]) => {
    if (!rufflePlayer) {
      return;
    }

    const volume = Array.isArray(value) ? value[0] : value;

    rufflePlayer.volume = volume / 100;
    dispatch(setConfig({ flashVolume: volume }));
  };

  // A drag changes the value many times a second, and each save writes the
  // settings file, so the level is saved once, when the slider lets go.
  const handleVolumeSliderCommit = (value: number | readonly number[]) => {
    window.mainApi.send('setAppConfig', { playerVolume: Array.isArray(value) ? value[0] : value });
  };

  const handleBack = () => {
    navigate('/explorer');
  };

  const loadFlash = () => {
    // Ruffle takes the log level as the movie loads, so the log starts here.
    const logLevel = stateAppScreen.appConfigDebugLogLevel;

    ruffleLog.start(logLevel);
    window.mainApi.startStaticServer(currentFileDirectory).then((port) => {
      if (!port) {
        setOpenFailedToLoadServerModal(true);
        return;
      }

      rufflePlayer
        .ruffle()
        .load({
          url: `http://localhost:${port}/${currentFileName}`,
          autoplay: autoplay ? 'on' : 'off',
          base: currentFileDirectory,
          allowScriptAccess: true,
          letterbox: stateAppScreen.appConfigLetterboxMode,
          contextMenu: contextMenuMode,
          backgroundExecutionMode,
          logLevel: toRuffleLogLevel(logLevel),
          openUrlMode: 'confirm',
          preferredRenderer:
            stateAppScreen.appConfigPreferredRenderer === 'auto'
              ? autoRenderer
              : stateAppScreen.appConfigPreferredRenderer,
          quality: stateAppScreen.appConfigQuality,
          scale: stateAppScreen.appConfigScale,
          forceScale: stateAppScreen.appConfigForceScale,
          allowFullscreen: stateAppScreen.appConfigAllowFullscreen,
          maxExecutionDuration: stateAppScreen.appConfigMaxExecutionDuration,
          playerRuntime: stateAppScreen.appConfigPlayerRuntime,
          deviceFontRenderer: stateAppScreen.appConfigDeviceFontRenderer,
          warnOnUnsupportedContent: false,
          playerVersion:
            stateAppScreen.appConfigEmulatePlayerVersion === 0
              ? null
              : stateAppScreen.appConfigEmulatePlayerVersion,
        })
        .then(() => {
          rufflePlayer.volume = stateAppScreen.flashMuted ? 0 : stateAppScreen.flashVolume / 100;
          redrawControls();
        })
        .catch(() => null);
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
      if (adjustOriginalSizeRef.current) {
        resizeWindowToMovie(metaData);
      }
    });

    container.appendChild(rufflePlayer);
    loadFlash();
  }, [url, filePath, stateAppScreen.appConfigEmulatePlayerVersion, rufflePlayer]);

  // The options below take effect on the movie that is already playing. The
  // other emulation options are read only when a movie loads.
  useEffect(() => {
    adjustOriginalSizeRef.current = stateAppScreen.appConfigAdjustOriginalSize;

    if (stateAppScreen.appConfigAdjustOriginalSize) {
      resizeWindowToMovie(rufflePlayer?.metadata);
    }
  }, [stateAppScreen.appConfigAdjustOriginalSize]);

  // A game the reader paused before the dialog opened stays paused after it closes.
  useEffect(() => {
    if (!rufflePlayer) {
      return;
    }

    if (isCoveredByDialog) {
      if (rufflePlayer.isPlaying) {
        rufflePlayer.pause();
        pausedForDialogRef.current = true;
        redrawControls();
      }
    } else if (pausedForDialogRef.current) {
      pausedForDialogRef.current = false;
      rufflePlayer.play();
      redrawControls();
    }
  }, [isCoveredByDialog, rufflePlayer]);

  // Ruffle reads these options each time it needs them rather than once at load,
  // on a right-click and when the window is hidden or shown again, so changing
  // them in the loaded config is enough.
  useEffect(() => {
    if (rufflePlayer?.loadedConfig) {
      rufflePlayer.loadedConfig.contextMenu = contextMenuMode;
      rufflePlayer.loadedConfig.backgroundExecutionMode = backgroundExecutionMode;
    }
  }, [contextMenuMode, backgroundExecutionMode]);

  return (
    <>
      {/* The split is there with the log closed too, so the movie's pane stays
          the same element when a replay opens the log beside it. */}
      <MPPanes className={header ? 'app-player' : 'app-player app-player--full'}>
        <MPPane className="app-player__movie" minSize="160px">
          {/* The stage is emptied whenever a new player goes in, so the pad sits
              beside it rather than inside it. */}
          <div className="app-player__viewport">
            <div
              id="main"
              className="app-player__stage"
              ref={player}
              onContextMenu={(e) => e.preventDefault()}
            />
            {showVirtualMouse && (
              <PlayerVirtualMousePad
                rufflePlayer={rufflePlayer}
                onClose={() => setShowVirtualMouse(false)}
              />
            )}
          </div>
          {stateAppScreen.appConfigShowPlayerController && (
            <div className="app-player__controller">
              <MPTooltip content={rufflePlayer?.isPlaying ? t('pause') : t('play')}>
                <MPIconButton
                  variant="text"
                  color="primary"
                  label={rufflePlayer?.isPlaying ? t('pause') : t('play')}
                  onClick={handlePauseOrPlay}
                  icon={<MPIcon icon={rufflePlayer?.isPlaying ? Pause : Play} size={18} />}
                />
              </MPTooltip>
              <MPTooltip content={t('replay')}>
                <MPIconButton
                  variant="text"
                  label={t('replay')}
                  onClick={loadFlash}
                  icon={<MPIcon icon={RotateCcw} size={18} />}
                />
              </MPTooltip>
              {/* The volume opens beside the button rather than taking a share of
                  the bar. It opens upwards, over the bottom of the movie, so it
                  reads as the player's own. The slider keeps its level while
                  muted, which is what unmuting goes back to. */}
              <MPPopover
                side="top"
                align="start"
                sideOffset={10}
                width={340}
                trigger={
                  <MPIconButton
                    variant="text"
                    label={t('volume')}
                    icon={<MPIcon icon={isSilent ? VolumeX : Volume2} size={18} />}
                  />
                }
              >
                <div className="app-player__volume">
                  {/* The slider fills its parent, which in a popup sized to its
                      content resolves to nothing. This box gives the row, and so
                      the popup, its width. */}
                  <div className="app-player__volume-slider">
                    <MPSlider
                      aria-label={t('volume')}
                      value={stateAppScreen.flashVolume}
                      disabled={stateAppScreen.flashMuted}
                      onValueChange={handleVolumeSliderChange}
                      onValueCommitted={handleVolumeSliderCommit}
                    />
                  </div>
                  <MPCheckbox
                    className="app-player__mute"
                    checked={stateAppScreen.flashMuted}
                    onCheckedChange={handleMuteChange}
                    label={t('mute')}
                  />
                </div>
              </MPPopover>
              <div className="app-player__controller-end">
                <MPTooltip content={t('virtual-mouse')}>
                  <MPIconButton
                    variant="text"
                    color={showVirtualMouse ? 'primary' : 'secondary'}
                    label={t('virtual-mouse')}
                    aria-pressed={showVirtualMouse}
                    onClick={() => setShowVirtualMouse(!showVirtualMouse)}
                    icon={<MPIcon icon={Mouse} size={18} />}
                  />
                </MPTooltip>
              </div>
            </div>
          )}
        </MPPane>
        {ruffleLog.level !== 'off' && (
          <MPPane className="app-player__log" defaultSize="36%" minSize="220px">
            <PlayerLogPanel store={ruffleLog.store} />
          </MPPane>
        )}
      </MPPanes>
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
