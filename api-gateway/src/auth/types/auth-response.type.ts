export type PublicUser = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type AuthResponse = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

export type PublicAuthResponse = {
  user: PublicUser;
  accessToken: string;
};