import { useState } from 'react';
import { useNavigate } from 'react-router';

import { logoutSession } from '../api/authApi';
import { useAuthStore } from './authStore';

type UseLogoutOptions = {
  redirectTo?: string;
};

export function useLogout(options: UseLogoutOptions = {}) {
  const navigate = useNavigate();

  const accessToken = useAuthStore((state) => state.accessToken);
  const clearAuth = useAuthStore((state) => state.logout);

  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    try {
      setIsLoading(true);

      await logoutSession(accessToken);
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      clearAuth();
      setIsLoading(false);
      navigate(options.redirectTo ?? '/');
    }
  };

  return {
    logout,
    isLoading,
  };
}