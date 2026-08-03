import { useEffect } from 'react';
import { AppState } from 'react-native';

import { warmUpBackend } from '../../infrastructure/api/apiConfig';

/**
 * Keeps the backend awake around the moments the user is likely to need it.
 *
 * Pinging on mount alone only helps a cold launch. The common case is the
 * user leaving the app open, switching away for longer than the ~15 minutes
 * the instance stays up, and coming back — so returning to the foreground is
 * what really matters. The seconds it takes them to reach a screen that hits
 * the API are the window used to boot the server.
 *
 * warmUpBackend() throttles itself, so calling it on every foreground event
 * is safe even when the user switches apps repeatedly.
 */
export function useBackendWarmUp(): void {
  useEffect(() => {
    warmUpBackend();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') warmUpBackend();
    });

    return () => subscription.remove();
  }, []);
}
