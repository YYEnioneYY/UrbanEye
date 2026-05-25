import { Prisma } from '../generated/prisma/client';

export const publicUserSelect = {
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;