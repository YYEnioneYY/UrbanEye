export type UserRole = 'user' | 'admin';

export type User = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};