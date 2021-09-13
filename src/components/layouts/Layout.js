/** @jsxImportSource @emotion/react */
import React from 'react';
import { Helmet } from 'react-helmet';

import { Container, Grid } from '@mui/material';
import { css } from '@emotion/react';
import { connect } from 'react-redux';
import Header from './Header';
import { headerArea } from '../../utils/styles';

const Layout = ({
  title = 'OpenRuffle Player',
  titleTail = ' - OpenRuffle Flash Player',
  withTail = true,
  header = true,
  container = true,
  withPadding = true,
  withBackButton = false,
  withHelpButton = false,
  children,
  config,
}) => (
  <div
    css={css`
        display: flex;
        flex-flow: column;
        height: 100vh;
      `}
  >
    <Helmet>
      <title>
        {title}
        {withTail ? titleTail : ''}
      </title>
    </Helmet>
    { header
      ? (
        <Header
          title={title}
          withBackButton={withBackButton}
          withHelpButton={withHelpButton}
        />
      ) : '' }
    <Grid
      container
      css={css`
        flex-grow: 1;
        background: ${config.isDarkTheme ? '#333' : '#eaeaea'};
        user-select: none;
        padding: ${withPadding ? '8px 0' : '0'};
      `}
    >
      {container
        ? (
          <Container>
            <Grid item xs={12} css={[header ? headerArea : []]}>
              {children}
            </Grid>
          </Container>
        )
        : (
          <Grid item xs={12} css={[header ? headerArea : []]}>
            {children}
          </Grid>
        )}
    </Grid>
  </div>
);

const mapStateToProps = state => ({
  config: state.config,
});

export default connect(mapStateToProps)(Layout);
