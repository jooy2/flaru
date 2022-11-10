/** @jsxImportSource @emotion/react */
import { useEffect } from 'react';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layouts/Layout';
import FlashPlayer from '../components/views/FlashPlayer';
import * as configActions from '../store/modules/config';

const Player = ({ config, ConfigActions }) => {
  const { ipcRenderer } = window.require('electron');
  const navigate = useNavigate();

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
      <FlashPlayer filePath={config.flashFilePath} header={!config.appConfigHideHeader} />
    </Layout>
  );
};

const mapStateToProps = (state) => ({
  config: state.config,
});

const mapDispatchToProps = (dispatch) => ({
  ConfigActions: bindActionCreators({ ...configActions }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Player);
