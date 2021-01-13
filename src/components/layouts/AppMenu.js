import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  List, ListItem,
  ListItemIcon, ListItemText, Paper,
} from '@material-ui/core';
import { HelpOutline } from '@material-ui/icons';
import { useTranslation } from 'react-i18next';

const AppMenu = () => {
  const history = useHistory();
  const { t } = useTranslation(['common', 'menu']);

  return (
    <Paper>
      <List component="nav" aria-label="main">
        <ListItem button onClick={() => history.push('/about')}>
          <ListItemIcon>
            <HelpOutline />
          </ListItemIcon>
          <ListItemText primary={t('menu:app-info')} />
        </ListItem>
      </List>
    </Paper>
  );
};

export default AppMenu;
