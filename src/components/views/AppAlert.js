import React from 'react';
import { Paper, Typography } from '@material-ui/core';
import { ErrorOutline, Info } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(1, 2),
    color: '#fff',
    '& p': {
      fontSize: '0.9em',
    },
    '& svg': {
      marginRight: theme.spacing(1),
    },
    '& span': {
      color: '#ffd028',
    },
    display: 'flex',
    alignItems: 'center',
  },
  info: {
    background: '#0d7dcf',
  },
  danger: {
    background: '#980b0b',
  },
  title: {
    flexGrow: 1,
  },
  mA: {
    margin: theme.spacing(1, 0),
  },
}));

const AppAlert = ({
  text = '',
  action = [],
  severity = 'info',
  withMargin = false,
}) => {
  const classes = useStyles();
  return (
    <Paper className={`${classes.root} ${severity === 'info' ? classes.info : classes.danger} ${withMargin ? classes.mA : {}}`}>
      {severity === 'info' ? <Info /> : <ErrorOutline /> }
      <Typography className={classes.title}>
        {text}
      </Typography>
      {action}
    </Paper>
  );
};

export default AppAlert;
