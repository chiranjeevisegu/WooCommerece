const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * Get audit logs with filtering
 * Query params: user, action, startDate, endDate, limit
 */
router.get('/', async (req, res) => {
    try {
        const { user, action, startDate, endDate, limit = 50 } = req.query;

        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (user) {
            query += ` AND user_id = $${paramIndex++}`;
            params.push(user);
        }

        if (action) {
            query += ` AND action = $${paramIndex++}`;
            params.push(action);
        }

        if (startDate) {
            query += ` AND created_at >= $${paramIndex++}`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND created_at <= $${paramIndex++}`;
            params.push(endDate);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
        params.push(parseInt(limit));

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

/**
 * Get user quota information
 */
router.get('/quota/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            'SELECT COUNT(*) FROM stores WHERE user_id = $1 AND status != $2',
            [userId, 'deleted']
        );

        const used = parseInt(result.rows[0].count);
        const limit = 5;

        res.json({
            userId,
            quota: {
                used,
                limit,
                remaining: limit - used
            }
        });
    } catch (error) {
        console.error('Error fetching quota:', error);
        res.status(500).json({ error: 'Failed to fetch quota' });
    }
});

module.exports = router;
