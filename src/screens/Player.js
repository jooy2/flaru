/** @jsxImportSource @emotion/react */
import React, { useEffect } from 'react';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layouts/Layout';
import FlashPlayer from '../components/views/FlashPlayer';
import * as configActions from '../store/modules/config';

const Player = ({
  config, ConfigActions,
}) => {
  const electron = window.require('electron');
  const { ipcRenderer } = electron;
  const navigate = useNavigate();

  const handleErrorAS3 = async () => {
    await ConfigActions.setConfig({
      flashFileName: '',
      flashFilePath: '',
      isAS3Error: true,
    });
    navigate('/explorer');
  };

  useEffect(() => {
    ipcRenderer.on('receiveResumeToExplorer', async () => {
      await ConfigActions.setConfig({
        flashFileName: '',
        flashFilePath: '',
      });
      navigate('/explorer');
    });

    return () => {
      ipcRenderer.removeAllListeners('receiveResumeToExplorer');
    };
  }, []);

  return (
    <Layout
      title={config.flashFileName}
      withBackButton
      withPadding={false}
      container={false}
      header={!config.appConfigHideHeader}
    >
      <FlashPlayer
        filePath={config.flashFilePath}
        header={!config.appConfigHideHeader}
        onErrorAS3={handleErrorAS3}
      />
    </Layout>
  );
};

const mapStateToProps = state => ({
  config: state.config,
});

const mapDispatchToProps = dispatch => ({
  ConfigActions: bindActionCreators({ ...configActions }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Player);
