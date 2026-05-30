export type UserRole = 'user' | 'admin';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  type: 'access';
  iat?: number;
  exp?: number;
};