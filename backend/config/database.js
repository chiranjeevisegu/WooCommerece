const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

async function initDB() {
  try {
    console.log('🔧 Initializing database...');

    // Create stores table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        store_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'woocommerce',
        status VARCHAR(50) DEFAULT 'provisioning',
        status_message TEXT,
        url TEXT,
        admin_url TEXT,
        namespace VARCHAR(255),
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create store_events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_events (
        id SERIAL PRIMARY KEY,
        store_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        message TEXT,
        severity VARCHAR(20) DEFAULT 'info',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
      )
    `);

    // Create audit_logs table for comprehensive tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        store_id VARCHAR(255),
        store_name VARCHAR(255),
        ip_address VARCHAR(45),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_stores_store_id ON stores(store_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_events_store_id ON store_events(store_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at)
    `);

    // Add new columns for quotas and timeouts
    await pool.query(`
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) DEFAULT 'default-user'
    `);

    await pool.query(`
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS provisioning_started_at TIMESTAMP
    `);

    await pool.query(`
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS provisioning_timeout_at TIMESTAMP
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id)
    `);

    // Add status_message column if it doesn't exist (migration)
    await pool.query(`
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS status_message TEXT
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

module.exports = { pool, initDB };
