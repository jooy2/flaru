import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  List, ListItem,
  ListItemIcon, ListItemText, Paper,
} from '@material-ui/core';
import { ArrowBack } from '@material-ui/icons';
import { useTranslation } from 'react-i18next';

const BackMenu = () => {
  const history = useHistory();
  const { t } = useTranslation(['common', 'menu']);

  return (
    <Paper>
      <List component="nav" aria-label="main">
        <ListItem button onClick={() => history.push('/')}>
          <ListItemIcon>
            <ArrowBack />
          </ListItemIcon>
          <ListItemText primary={t('menu:back')} />
        </ListItem>
      </List>
    </Paper>
  );
};

export default BackMenu;
