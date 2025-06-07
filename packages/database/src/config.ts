import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from root .env file
config({ path: resolve(__dirname, '../../../.env') });

const env = process.env.NODE_ENV || 'development';

interface DatabaseConfig {
  connectionString: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMillis?: number;
}

const configs: Record<string, DatabaseConfig> = {
  development: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fun_scrum',
    maxConnections: 10,
    idleTimeoutMillis: 30000,
  },
  test: {
    connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fun_scrum_test',
    maxConnections: 5,
    idleTimeoutMillis: 10000,
  },
  production: {
    connectionString: process.env.DATABASE_URL || '',
    ssl: true,
    maxConnections: 20,
    idleTimeoutMillis: 60000,
  },
};

export const dbConfig = configs[env];

if (!dbConfig.connectionString) {
  throw new Error(`DATABASE_URL environment variable is required for ${env} environment`);
}

// Export the current environment for other modules to use
export const currentEnv = env; 