/** @jsxImportSource @emotion/react */
import { useEffect, useMemo, useRef } from 'react';
import { css } from '@emotion/react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { getOS } from '../../utils/helper';
import * as configActions from '../../store/modules/config';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    RufflePlayer: any;
  }
}

const FlashPlayer = ({
  url = '',
  autoplay = true,
  filePath = '',
  header = true,
  config,
  ConfigActions,
}) => {
  const player: any = useRef();
  const { ipcRenderer } = window.require('electron');
  const os = useMemo(() => getOS(), []);

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
      letterbox: config.appConfigLetterbox ? 'on' : 'off',
      logLevel: 'error',
      contextMenu: !config.appConfigHideContext,
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
      await ConfigActions.setConfig({
        flashFileSwfVer: metaData?.swfVersion,
        flashFileFrame: metaData?.numFrames,
        flashFileAs3: metaData?.isActionScript3,
        flashFileWidth: metaData?.width,
        flashFileHeight: metaData?.height,
        flashFileBackgroundColor: metaData?.backgroundColor,
        flashFileFrameRate: metaData?.frameRate,
      });
      if (config.appConfigAdjustOriginalSize && metaData?.width && metaData?.height) {
        ipcRenderer.send('resizeWindow', {
          width: metaData.width,
          height: metaData.height,
        });
      }
    });
    container.appendChild(rPlayer);
    rPlayer.load(realPath);
    rPlayer.addEventListener('oncontextmenu', (e) => e.preventDefault());
  }, [url, filePath]);

  return (
    <div
      id="main"
      css={css`
        align-items: stretch;
        width: 100%;
        height: ${header ? 'calc(100vh - 48px)' : '100vh'};
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

const mapStateToProps = (state) => ({
  config: state.config,
});

const mapDispatchToProps = (dispatch) => ({
  ConfigActions: bindActionCreators({ ...configActions }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(FlashPlayer);
