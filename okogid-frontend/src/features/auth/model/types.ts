import type { User } from '../../../entities/user/model/types';

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
};

export type AuthState = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isSessionLoading: boolean;

  setAuth: (data: AuthResponse) => void;
  setSessionLoading: (isLoading: boolean) => void;
  logout: () => void;
};