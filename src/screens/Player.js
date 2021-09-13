/** @jsxImportSource @emotion/react */
import React from 'react';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Layout from '../components/layouts/Layout';
import FlashPlayer from '../components/views/FlashPlayer';
import * as configActions from '../store/modules/config';

const Player = ({
  config, ConfigActions,
}) => {
  const history = useHistory();
  const handleErrorAS3 = async () => {
    await ConfigActions.setConfig({
      flashFileName: '',
      flashFilePath: '',
      isAS3Error: true,
    });
    history.push('/explorer');
  };

  return (
    <Layout
      title={config.flashFileName}
      withBackButton
      withPadding={false}
      container={false}
    >
      <FlashPlayer
        filePath={config.flashFilePath}
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
