/** @jsxImportSource @emotion/react */
import { useEffect, useMemo, useRef } from 'react';
import { css } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/renderer/store';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';

const FlashPlayer = ({ url = '', autoplay = true, filePath = '', header = true }) => {
  const player: any = useRef();
  const dispatch = useDispatch();
  const stateAppScreen = useSelector((state: RootState) => state.appScreen);
  const os = useMemo(() => stateAppScreen.mainGlobalValues.ENV_OS, []);

  useEffect((): any => {
    const container = player.current;
    container.innerHTML = '';

    let realPath;
    if (os === 'Linux' || os === 'macOS') {
      realPath = filePath.indexOf('file:') === -1 ? `file:///${filePath}` : filePath;
    } else {
      realPath = filePath.replace('file:///', '');
    }

    window.RufflePlayer = window.RufflePlayer || {};
    window.RufflePlayer.config = {
      autoplay,
      polyfills: false,
      preloader: false,
      letterbox: stateAppScreen.appConfigLetterbox ? 'on' : 'off',
      logLevel: 'error',
      contextMenu: !stateAppScreen.appConfigHideContext,
      playerVersion:
        stateAppScreen.appConfigEmulatePlayerVersion === 0
          ? null
          : stateAppScreen.appConfigEmulatePlayerVersion,
      base: `${realPath.indexOf('file:///') === -1 ? 'file:///' : ''}${realPath.substr(
        0,
        realPath.lastIndexOf(os === 'Windows' ? '\\' : '/'),
      )}`,
    };
    const ruffle = window.RufflePlayer.newest();
    const rPlayer = ruffle.createPlayer();
    rPlayer.id = 'player';
    rPlayer.addEventListener('loadedmetadata', async () => {
      const metaData = rPlayer?.metadata;
      await dispatch(
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
    container.appendChild(rPlayer);
    rPlayer.load(realPath);
    rPlayer.addEventListener('oncontextmenu', (e) => e.preventDefault());
  }, [url, filePath, stateAppScreen.appConfigEmulatePlayerVersion]);

  return (
    <div
      id="main"
      css={css`
        align-items: stretch;
        width: 100%;
        height: ${header ? 'calc(100vh - 42px)' : '100vh'};
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #000000;
        color: white;
        #player {
          width: 100%;
          height: 100%;
          display: block;
        }
        #container {
          margin: 10px;
          width: 100%;
          height: 100%;
          align-self: center;
        }
      `}
      ref={player}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};

export default FlashPlayer;
