import { useMemo } from 'react';

import { useRows } from './live';
import { activeSessionQuery } from './queries/sessions';

/**
 * Whether a session is in progress. `null` until the query has answered, because
 * Start must not flash as Start for a frame and then turn into Resume.
 */
export function useSessionRunning(): boolean | null {
  const rows = useRows(
    useMemo(() => activeSessionQuery(), []),
    [],
  );
  return rows === null ? null : rows.length > 0;
}
