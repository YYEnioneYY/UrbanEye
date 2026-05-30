import { UserRole } from '@prisma/client';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  type: 'access';
};

export type RefreshTokenPayload = {
  sub: string;
  sid: string;
  type: 'refresh';
};