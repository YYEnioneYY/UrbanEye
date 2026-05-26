import { create } from 'zustand';

import type { AuthResponse, AuthState } from './types';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isSessionLoading: true,

  setAuth: (data: AuthResponse) => {
    set({
      user: data.user,
      accessToken: data.accessToken,
      isAuthenticated: true,
      isSessionLoading: false,
    });
  },

  setSessionLoading: (isLoading: boolean) => {
    set({
      isSessionLoading: isLoading,
    });
  },

  logout: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isSessionLoading: false,
    });
  },
}));