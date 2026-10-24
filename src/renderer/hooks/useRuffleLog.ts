import { useEffect, useRef, useState } from 'react';
import { createConsole, LogStore } from 'lognal';

import { captureRuffleConsole, DebugLogLevel } from '@/renderer/utils/ruffleLog';

// Records what Ruffle writes while a movie plays, for the debug log beside it.
// Ruffle takes its log level when a movie loads, so recording starts there too,
// before the movie does, and the level shown is the one the movie loaded with.
// The store outlives a reload, so a replay carries on in the same log.
export default function useRuffleLog() {
  const [level, setLevel] = useState<DebugLogLevel>('off');
  const [store] = useState(() => new LogStore());
  const stopRef = useRef<(() => void) | null>(null);

  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
  };

  const start = (nextLevel: DebugLogLevel) => {
    stop();
    setLevel(nextLevel);

    if (nextLevel !== 'off') {
      stopRef.current = captureRuffleConsole(createConsole(store));
    }
  };

  useEffect(() => stop, []);

  return { level, store, start };
}
