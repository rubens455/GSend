import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error('SUPABASE_DB_URL environment variable is not set.');
}

const client = postgres(connectionString, {
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(path.join(process.cwd(), 'prod-ca-2021.crt')).toString(),
  }
});

export const db = drizzle(client, { schema }); 