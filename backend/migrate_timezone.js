const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { pool } = require('./config/database');

async function migrate() {
    try {
        console.log('🔄 Migrating timestamps to TIMESTAMPTZ...');

        // Stores table
        await pool.query(`
            ALTER TABLE stores 
            ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
            ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC',
            ALTER COLUMN provisioning_started_at TYPE TIMESTAMPTZ USING provisioning_started_at AT TIME ZONE 'UTC',
            ALTER COLUMN provisioning_timeout_at TYPE TIMESTAMPTZ USING provisioning_timeout_at AT TIME ZONE 'UTC';
        `);
        console.log('✅ Updated stores table');

        // Events table
        await pool.query(`
            ALTER TABLE store_events 
            ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
        `);
        console.log('✅ Updated store_events table');

        // Audit logs table
        await pool.query(`
            ALTER TABLE audit_logs 
            ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
        `);
        console.log('✅ Updated audit_logs table');

        console.log('🎉 Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
