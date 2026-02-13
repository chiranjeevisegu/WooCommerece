const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * Get global activity log (all stores, recent events)
 * Query params: limit (default 50)
 */
router.get('/activity', async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const result = await pool.query(
            `SELECT 
                se.id,
                se.store_id,
                s.name as store_name,
                se.event_type,
                se.message,
                se.severity,
                se.created_at
             FROM store_events se
             LEFT JOIN stores s ON se.store_id = s.store_id
             ORDER BY se.created_at DESC
             LIMIT $1`,
            [parseInt(limit)]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching activity log:', error);
        res.status(500).json({ error: 'Failed to fetch activity log' });
    }
});

/**
 * Get enhanced metrics with provisioning stats
 */
router.get('/metrics/enhanced', async (req, res) => {
    try {
        // Basic counts
        const countsResult = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'ready' THEN 1 END) as active,
                COUNT(CASE WHEN status IN ('provisioning', 'deploying', 'creating') THEN 1 END) as provisioning,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
            FROM stores
            WHERE status != 'deleted'
        `);

        // Provisioning duration stats (for completed stores)
        const durationResult = await pool.query(`
            SELECT 
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration_seconds,
                MIN(EXTRACT(EPOCH FROM (updated_at - created_at))) as min_duration_seconds,
                MAX(EXTRACT(EPOCH FROM (updated_at - created_at))) as max_duration_seconds
            FROM stores
            WHERE status = 'ready' AND created_at IS NOT NULL AND updated_at IS NOT NULL
        `);

        // Failure rate
        const failureRateResult = await pool.query(`
            SELECT 
                COUNT(*) as total_attempts,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
            FROM stores
        `);

        const totalAttempts = parseInt(failureRateResult.rows[0].total_attempts) || 0;
        const failedCount = parseInt(failureRateResult.rows[0].failed_count) || 0;
        const failureRate = totalAttempts > 0 ? ((failedCount / totalAttempts) * 100).toFixed(1) : 0;

        // Recent failures (last 24 hours)
        const recentFailuresResult = await pool.query(`
            SELECT COUNT(*) as recent_failures
            FROM stores
            WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours'
        `);

        res.json({
            ...countsResult.rows[0],
            provisioning_stats: {
                avg_duration_seconds: parseFloat(durationResult.rows[0].avg_duration_seconds) || 0,
                min_duration_seconds: parseFloat(durationResult.rows[0].min_duration_seconds) || 0,
                max_duration_seconds: parseFloat(durationResult.rows[0].max_duration_seconds) || 0
            },
            failure_rate: parseFloat(failureRate),
            recent_failures_24h: parseInt(recentFailuresResult.rows[0].recent_failures)
        });
    } catch (error) {
        console.error('Error fetching enhanced metrics:', error);
        res.status(500).json({ error: 'Failed to fetch enhanced metrics' });
    }
});

/**
 * Get recent failures with detailed error messages
 * Query params: limit (default 10)
 */
router.get('/failures', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const result = await pool.query(
            `SELECT 
                store_id,
                name,
                status_message,
                error,
                created_at,
                updated_at,
                EXTRACT(EPOCH FROM (updated_at - created_at)) as duration_seconds
             FROM stores
             WHERE status = 'failed'
             ORDER BY updated_at DESC
             LIMIT $1`,
            [parseInt(limit)]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching failures:', error);
        res.status(500).json({ error: 'Failed to fetch failures' });
    }
});

/**
 * Get provisioning timeline (stores created over time)
 * Returns daily counts for the last 7 days
 */
router.get('/timeline', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_created,
                COUNT(CASE WHEN status = 'ready' THEN 1 END) as successful,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
            FROM stores
            WHERE created_at > NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching timeline:', error);
        res.status(500).json({ error: 'Failed to fetch timeline' });
    }
});

module.exports = router;
