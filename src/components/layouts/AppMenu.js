/** @jsxImportSource @emotion/react */
import React from 'react';
import {
  List, ListItem,
  ListItemIcon, ListItemText, Paper,
} from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { goToExtLink } from '../../utils/helper';

const AppMenu = () => {
  const [t] = useTranslation(['common', 'menu']);

  return (
    <Paper>
      <List component="nav" aria-label="main">
        <ListItem button onClick={(e) => goToExtLink(e, 'https://github.com/jooy2/open-ruffle-player/releases')}>
          <ListItemIcon>
            <OpenInNew />
          </ListItemIcon>
          <ListItemText primary={t('menu:check-for-updates')} />
        </ListItem>
      </List>
    </Paper>
  );
};

export default AppMenu;
