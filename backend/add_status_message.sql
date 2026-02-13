-- Add status_message column to existing stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS status_message TEXT;
