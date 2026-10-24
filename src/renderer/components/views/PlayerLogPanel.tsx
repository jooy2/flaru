import type { LogStore } from 'lognal';
import { LogViewer } from 'lognal/react';
import 'lognal/style.css';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { RootState } from '@/renderer/store';

// The debug log beside the movie. The viewer's own toolbar follows new lines,
// scrolls, wraps, clears and filters. Its colours follow the app theme, so the
// theme menu is left out, and a link in the log stays text: a movie writes what
// it likes, and nothing it writes should open a page in the app.
export default function PlayerLogPanel({ store }: { store: LogStore }) {
  const [t, i18n] = useTranslation(['menu']);
  const isDarkTheme = useSelector((state: RootState) => state.appScreen.isDarkTheme);

  return (
    <LogViewer
      className="app-player-log"
      store={store}
      theme={isDarkTheme ? 'dark' : 'light'}
      locale={i18n.language}
      labels={{ viewer: t('menu:debug-log') }}
      toolbar={{ theme: false }}
      linkClick="ignore"
    />
  );
}
