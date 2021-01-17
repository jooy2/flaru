import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  List, ListItem,
  ListItemIcon, ListItemText, Paper,
} from '@material-ui/core';
import { HelpOutline, OpenInNew } from '@material-ui/icons';
import { useTranslation } from 'react-i18next';
import { goToExtLink } from '../../utils/helper';

const AppMenu = () => {
  const history = useHistory();
  const { t } = useTranslation(['common', 'menu']);

  return (
    <Paper>
      <List component="nav" aria-label="main">
        <ListItem button onClick={(e) => goToExtLink(e, 'https://github.com/leejooy96/open-ruffle-player/releases')}>
          <ListItemIcon>
            <OpenInNew />
          </ListItemIcon>
          <ListItemText primary={t('menu:check-for-updates')} />
        </ListItem>
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
