/** @jsxImportSource @emotion/react */
import React, { useEffect, useRef } from 'react';
import { css } from '@emotion/react';
import { getOS } from '../../utils/helper';

const FlashPlayer = ({
  url = '',
  autoPlay = true,
  filePath = null,
  header = true,
  onErrorAS3,
}) => {
  const player = useRef();

  useEffect(() => {
    try {
      const container = player.current;
      container.innerHTML = '';

      let realPath;
      const os = getOS();
      if (os === 'Linux' || os === 'macOS') {
        realPath = filePath.indexOf('file:') === -1 ? `file:///${filePath}` : filePath;
      } else {
        realPath = filePath.replace('file:///', '');
      }

      window.RufflePlayer = window.RufflePlayer || {};
      window.RufflePlayer.config = {
        autoPlay,
        polyfills: false,
        letterbox: 'on',
        base: `${realPath.indexOf('file:///') === -1 ? 'file:///' : ''}${realPath.substr(0, realPath.lastIndexOf(os === 'Windows' ? '\\' : '/'))}`,
      };
      const ruffle = window.RufflePlayer.newest();
      const rPlayer = ruffle.createPlayer();
      rPlayer.id = 'player';
      rPlayer.addEventListener('loadedmetadata', () => {
        if (rPlayer?.metadata?.isActionScript3) {
          onErrorAS3();
        }
      });
      container.appendChild(rPlayer);
      rPlayer.load(realPath);
      rPlayer.addEventListener('oncontextmenu', e => e.preventDefault());
    } catch (e) { return null; }

    return () => {
      window.rufflePlayer = {};
      if (window?.rufflePlayer?.instance) {
        window.rufflePlayer.instance.destroy();
        window.rufflePlayer.instance = null;
      }
    };
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

export default FlashPlayer;
