// =============================================
// ParkEase - PostgreSQL + PostGIS Connection Pool
// =============================================
const { Pool } = require('pg');
const config = require('./index');

let poolConfig;

if (config.db.url) {
  // Production: use connection string (Supabase / Neon / Render)
  poolConfig = {
    connectionString: config.db.url,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
} else {
  // Local development
  poolConfig = {
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    user: config.db.user,
    password: config.db.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

const pool = new Pool(poolConfig);

// Log connection events in dev
pool.on('connect', () => {
  if (config.isDev) {
    console.log('📦 New database connection established');
  }
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err.message);
});

/**
 * Helper: execute a query on the pool
 */
const query = (text, params) => pool.query(text, params);

/**
 * Helper: get a client from the pool for transactions
 */
const getClient = () => pool.connect();

/**
 * Test the database connection
 */
const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW() AS now');
    console.log(`✅ Database connected at ${res.rows[0].now}`);

    // Verify PostGIS extension
    try {
      const postgis = await pool.query("SELECT PostGIS_Version() AS version");
      console.log(`✅ PostGIS version: ${postgis.rows[0].version}`);
    } catch (e) {
      console.warn('⚠️  PostGIS not detected. It will be enabled during migration.');
    }
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    throw err;
  }
};

/**
 * Helper: Run a transaction.
 * @param {function(Client): Promise<any>} callback - Function that takes a pg client and returns a promise.
 */
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, getClient, testConnection, withTransaction };
