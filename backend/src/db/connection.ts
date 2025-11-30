import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Detect if we need SSL (Render requires SSL for external connections)
// Check for render.com, oregon-postgres, sslmode param, or production env
const isRemoteDB = process.env.DATABASE_URL?.includes('render.com') ||
                   process.env.DATABASE_URL?.includes('oregon-postgres') ||
                   process.env.DATABASE_URL?.includes('sslmode=require') ||
                   process.env.NODE_ENV === 'production';

console.log('🔌 Database SSL enabled:', isRemoteDB);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemoteDB ? { rejectUnauthorized: false } : false,
});

// Test de connexion
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

export default pool;

