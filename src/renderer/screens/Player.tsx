/** @jsxImportSource @emotion/react */
import { useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/renderer/store';
import Layout from '@/renderer/components/layouts/Layout';
import FlashPlayer from '@/renderer/components/views/FlashPlayer';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';

const Player = () => {
  const stateAppScreen = useSelector((state: RootState) => state.appScreen);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    window.mainApi.receive('receiveResumeToExplorer', () => {
      dispatch(
        setConfig({
          flashFileName: '',
          flashFilePath: '',
        }),
      );
      navigate('/explorer');
    });

    return () => {
      window.mainApi.removeListener('receiveResumeToExplorer');
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
