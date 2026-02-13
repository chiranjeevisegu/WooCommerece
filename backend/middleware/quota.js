const { pool } = require('../config/database');

/**
 * Quota Enforcement Middleware
 * Limits users to maximum 5 stores
 */
async function checkStoreQuota(req, res, next) {
    try {
        // Get user ID from header or default
        const userId = req.headers['x-user-id'] || 'default-user';

        // Count active stores for this user
        const result = await pool.query(
            'SELECT COUNT(*) FROM stores WHERE user_id = $1 AND status != $2',
            [userId, 'deleted']
        );

        const storeCount = parseInt(result.rows[0].count);
        const STORE_LIMIT = 5;

        if (storeCount >= STORE_LIMIT) {
            return res.status(429).json({
                error: `You've reached the maximum limit of ${STORE_LIMIT} stores`,
                quota: {
                    used: storeCount,
                    limit: STORE_LIMIT
                }
            });
        }

        // Attach user ID to request for later use
        req.userId = userId;
        req.quota = {
            used: storeCount,
            limit: STORE_LIMIT
        };

        next();
    } catch (error) {
        console.error('Quota check error:', error);
        res.status(500).json({ error: 'Failed to check store quota' });
    }
}

/**
 * Audit Logging Helper
 * Logs all create/delete actions
 */
async function logAuditEvent(userId, action, storeId, storeName, ipAddress = null, metadata = {}) {
    try {
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, store_id, store_name, ip_address, metadata) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, action, storeId, storeName, ipAddress, JSON.stringify(metadata)]
        );
        console.log(`📝 Audit: ${userId} - ${action} - ${storeId}`);
    } catch (error) {
        console.error('Failed to log audit event:', error);
        // Don't fail the request if audit logging fails
    }
}

module.exports = {
    checkStoreQuota,
    logAuditEvent
};
