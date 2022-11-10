/** @jsxImportSource @emotion/react */
import { Helmet } from 'react-helmet';

import { Container, Grid } from '@mui/material';
import { css } from '@emotion/react';
import { connect } from 'react-redux';
import Header from './Header';
import { headerArea } from '../../utils/styles';

const Layout = ({
  title = 'Flaru Player',
  titleTail = ' - Flaru Flash Player',
  withTail = true,
  header = true,
  container = true,
  center = false,
  withPadding = true,
  withBackButton = false,
  children,
  config,
}) => (
  <div
    css={css`
      display: flex;
      flex-flow: column;
      height: 100vh;
      *::-webkit-scrollbar {
        width: 0.4em;
      }
      *::-webkit-scrollbar-track {
        -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0);
      }
      *::-webkit-scrollbar-thumb {
        background-color: ${config.isDarkTheme ? '#444444' : '#a7a7a7'};
      }
    `}
  >
    <Helmet>
      <title>
        {title}
        {withTail ? titleTail : ''}
      </title>
    </Helmet>
    {header ? <Header title={title} withBackButton={withBackButton} /> : ''}
    <Grid
      container
      css={css`
        flex-grow: 1;
        background: ${config.isDarkTheme ? '#1a1a1a' : '#eaeaea'};
        user-select: none;
        padding: ${withPadding ? '8px 0' : '0'};
      `}
      alignItems={center ? 'center' : 'start'}
    >
      {container ? (
        <Container>
          <Grid item xs={12} css={[header ? headerArea : []]}>
            {children}
          </Grid>
        </Container>
      ) : (
        <Grid item xs={12} css={[header ? headerArea : []]}>
          {children}
        </Grid>
      )}
    </Grid>
  </div>
);

const mapStateToProps = (state) => ({
  config: state.config,
});

export default connect(mapStateToProps)(Layout);
