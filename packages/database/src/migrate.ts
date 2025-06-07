import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from './schema';
import { dbConfig, currentEnv } from './config';

async function main() {
  console.log(`Migrating database in ${currentEnv} environment...`);
  
  const pool = new Pool({
    connectionString: dbConfig.connectionString,
    ssl: dbConfig.ssl,
    max: dbConfig.maxConnections,
    idleTimeoutMillis: dbConfig.idleTimeoutMillis,
  });

  const db = drizzle(pool);

  console.log('Dropping existing tables...');

  await db.execute(sql`
    DROP TABLE IF EXISTS votes CASCADE;
    DROP TABLE IF EXISTS stories CASCADE;
    DROP TABLE IF EXISTS planning_sessions CASCADE;
    DROP TABLE IF EXISTS team_members CASCADE;
    DROP TABLE IF EXISTS team_scrum_masters CASCADE;
    DROP TABLE IF EXISTS teams CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS settings CASCADE;
  `);

  console.log('Running migrations...');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      scrum_master_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id SERIAL PRIMARY KEY,
      team_id INTEGER REFERENCES teams(id),
      user_id INTEGER REFERENCES users(id),
      role TEXT NOT NULL DEFAULT 'MEMBER',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_scrum_masters (
      id SERIAL PRIMARY KEY,
      team_id INTEGER REFERENCES teams(id),
      user_id INTEGER REFERENCES users(id),
      is_lead BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(team_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS planning_sessions (
      id SERIAL PRIMARY KEY,
      team_id INTEGER REFERENCES teams(id),
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      settings JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stories (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES planning_sessions(id),
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      story_points INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      story_id INTEGER REFERENCES stories(id),
      user_id INTEGER REFERENCES users(id),
      value TEXT NOT NULL,
      confidence INTEGER NOT NULL DEFAULT 5,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      default_story_points JSONB NOT NULL DEFAULT '[1, 2, 3, 5, 8, 13, 21]',
      default_t_shirt_sizes JSONB NOT NULL DEFAULT '["XS", "S", "M", "L", "XL"]',
      allow_custom_votes BOOLEAN NOT NULL DEFAULT false,
      require_vote_confirmation BOOLEAN NOT NULL DEFAULT true,
      auto_reveal_votes BOOLEAN NOT NULL DEFAULT false,
      voting_time_limit INTEGER NOT NULL DEFAULT 60,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Migrations completed successfully!');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
}); 