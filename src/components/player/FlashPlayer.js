import React, { useEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  player: {
    alignItems: 'stretch',
    width: '100%',
    height: 'calc(100vh - 48px)',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: '#000000',
    color: 'white',
    '& #player': {
      width: '100%',
      height: '100%',
      display: 'block',
    },
    '& #container': {
      margin: '10px',
      width: '100%',
      height: '100%',
      alignSelf: 'center',
    },
  },
}));

const FlashPlayer = ({
  url = '',
  autoPlay = true,
  filePath = null,
}) => {
  const classes = useStyles();
  const player = useRef();
  const electron = window.require('electron');
  const { remote } = electron;

  useEffect(() => {
    try {
      const container = player.current;
      container.innerHTML = '';
      window.RufflePlayer = window.RufflePlayer || {};
      window.RufflePlayer.config = {
        autoPlay,
        polyfills: false,
        letterbox: 'on',
      };
      const ruffle = window.RufflePlayer.newest();
      const rPlayer = ruffle.createPlayer();
      rPlayer.id = 'player';
      container.appendChild(rPlayer);
      let realPath;
      const os = remote.getGlobal('ENV_OS');
      if (os === 'Linux' || os === 'macOS') {
        realPath = filePath.indexOf('file:') === -1 ? `file:///${filePath}` : filePath;
      } else {
        realPath = filePath.replace('file:///', '');
      }
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
      className={classes.player}
      ref={player}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};

export default FlashPlayer;
