import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
  },

  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://events_user:events_password@camera-events-postgres:5432/okogid_events_db',
  },
});