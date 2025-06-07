import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export function createClient() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'fun_scrum',
  });

  return drizzle(pool);
}

export const db = createClient(); 