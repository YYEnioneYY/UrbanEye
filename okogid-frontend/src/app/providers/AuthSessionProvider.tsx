import { useEffect, type ReactNode } from 'react';

import { refreshSessionOnce } from '../../features/auth/api/authApi';
import { getRefreshDelayMs } from '../../features/auth/lib/jwt';
import { useAuthStore } from '../../features/auth/model/authStore';

type AuthSessionProviderProps = {
  children: ReactNode;
};

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.logout);
  const setSessionLoading = useAuthStore((state) => state.setSessionLoading);

  useEffect(() => {
    let isActive = true;

    async function restoreSession() {
      try {
        setSessionLoading(true);

        const authData = await refreshSessionOnce();

        if (!isActive) {
          return;
        }

        setAuth(authData);
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.warn('Refresh session failed:', error);
        clearAuth();
      } finally {
        if (isActive) {
          setSessionLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isActive = false;
    };
  }, [setAuth, clearAuth, setSessionLoading]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isActive = true;

    const delay = getRefreshDelayMs(accessToken);

    const timeoutId = window.setTimeout(async () => {
      try {
        const authData = await refreshSessionOnce();

        if (!isActive) {
          return;
        }

        setAuth(authData);
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.warn('Scheduled refresh failed:', error);
        clearAuth();
      }
    }, delay);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [accessToken, setAuth, clearAuth]);

  return children;
}