-- Add user tracking and audit logging to database

-- Add user_id column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) DEFAULT 'default-user';
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    store_id VARCHAR(255),
    store_name VARCHAR(255),
    ip_address VARCHAR(45),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_store ON audit_logs(store_id);

-- Add provisioning timeout tracking
ALTER TABLE stores ADD COLUMN IF NOT EXISTS provisioning_started_at TIMESTAMP;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS provisioning_timeout_at TIMESTAMP;
