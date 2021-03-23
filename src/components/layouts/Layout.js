import React from 'react';
import { Helmet } from 'react-helmet';

import { Container, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import Header from './Header';

const useStyles = makeStyles(theme => ({
  layoutRoot: {
    display: 'flex',
    flexFlow: 'column',
    height: '100vh',
  },
  headerArea: {
    marginTop: '48px',
    flexShrink: 0,
  },
  layoutContentWrapper: props => ({
    flexGrow: 1,
    background: theme.palette.type === 'light' ? '#eaeaea' : '#333',
    userSelect: 'none',
    padding: props.withPadding ? theme.spacing(1, 0) : 0,
  }),
}));

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
}) => {
  const classes = useStyles({ withPadding });

  return (
    <div className={classes.layoutRoot}>
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
      <Grid container className={classes.layoutContentWrapper}>
        {
        container
          ? (
            <Container>
              <Grid item xs={12} className={(header ? classes.headerArea : '')}>
                {children}
              </Grid>
            </Container>
          )
          : (
            <Grid item xs={12} className={(header ? classes.headerArea : '')}>
              {children}
            </Grid>
          )
        }
      </Grid>
    </div>
  );
};

export default Layout;
