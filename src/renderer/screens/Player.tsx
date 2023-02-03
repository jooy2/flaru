/** @jsxImportSource @emotion/react */
import { useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/renderer/store';
import Layout from '@/renderer/components/layouts/Layout';
import FlashPlayer from '@/renderer/components/views/FlashPlayer';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';

const Player = () => {
  const { ipcRenderer } = window.require('electron');
  const stateAppScreen = useSelector((state: RootState) => state.appScreen);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    ipcRenderer.on('receiveResumeToExplorer', async () => {
      await dispatch(
        setConfig({
          flashFileName: '',
          flashFilePath: '',
        }),
      );
      navigate('/explorer');
    });

    return () => {
      ipcRenderer.removeAllListeners('receiveResumeToExplorer');
    };
  }, []);

  return (
    <Layout
      title={stateAppScreen.flashFileName}
      withBackButton
      withPadding={false}
      container={false}
      header={!stateAppScreen.appConfigHideHeader}
    >
      <FlashPlayer
        filePath={stateAppScreen.flashFilePath}
        header={!stateAppScreen.appConfigHideHeader}
      />
    </Layout>
  );
};

export default Player;
