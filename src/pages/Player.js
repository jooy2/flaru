import React from 'react';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Layout from '../components/layouts/Layout';
import FlashPlayer from '../components/player/FlashPlayer';
import * as configActions from '../store/modules/config';

const Player = ({
  config,
}) => (
  <Layout
    title={config.flashFileName}
    withBackButton
    withPadding={false}
    container={false}
  >
    <FlashPlayer filePath={config.flashFilePath} />
  </Layout>
);

const mapStateToProps = state => ({
  config: state.config,
});

const mapDispatchToProps = dispatch => ({
  ConfigActions: bindActionCreators({ ...configActions }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Player);
