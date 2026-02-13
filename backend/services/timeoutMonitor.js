const { pool } = require('../config/database');
const helm = require('./helm');

/**
 * Provisioning Timeout Monitor
 * Checks for stores that have exceeded the 10-minute provisioning timeout
 * and marks them as failed
 */
class TimeoutMonitor {
    constructor() {
        this.intervalId = null;
        this.checkIntervalMs = 60 * 1000; // Check every minute
    }

    start() {
        console.log('🕐 Starting provisioning timeout monitor...');
        this.intervalId = setInterval(() => this.checkTimeouts(), this.checkIntervalMs);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('🛑 Stopped provisioning timeout monitor');
        }
    }

    async checkTimeouts() {
        try {
            // Find stores that are still provisioning and have exceeded timeout
            const result = await pool.query(
                `SELECT store_id, name, provisioning_started_at, provisioning_timeout_at 
                 FROM stores 
                 WHERE status = 'provisioning' 
                 AND provisioning_timeout_at < CURRENT_TIMESTAMP`
            );

            if (result.rows.length > 0) {
                console.log(`⏰ Found ${result.rows.length} timed-out stores`);

                for (const store of result.rows) {
                    await this.handleTimeout(store);
                }
            }
        } catch (error) {
            console.error('Error checking timeouts:', error);
        }
    }

    async handleTimeout(store) {
        try {
            console.log(`⏰ Store ${store.store_id} (${store.name}) exceeded provisioning timeout`);

            // Update status to failed
            await pool.query(
                `UPDATE stores 
                 SET status = 'failed', 
                     status_message = 'Provisioning timeout exceeded (10 minutes)',
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE store_id = $1`,
                [store.store_id]
            );

            // Log event
            await pool.query(
                `INSERT INTO store_events (store_id, event_type, message, severity) 
                 VALUES ($1, $2, $3, $4)`,
                [store.store_id, 'provisioning_timeout', 'Provisioning exceeded 10-minute timeout', 'error']
            );

            // Clean up partial resources
            try {
                await helm.uninstallStore(store.store_id);
                console.log(`✅ Cleaned up resources for timed-out store ${store.store_id}`);
            } catch (cleanupError) {
                console.error(`Failed to cleanup ${store.store_id}:`, cleanupError.message);
            }
        } catch (error) {
            console.error(`Error handling timeout for ${store.store_id}:`, error);
        }
    }
}

// Export singleton instance
const timeoutMonitor = new TimeoutMonitor();

module.exports = timeoutMonitor;
