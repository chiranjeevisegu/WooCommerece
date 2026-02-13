const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const orchestrator = require('./orchestrator');
const { checkStoreQuota, logAuditEvent } = require('../middleware/quota');

// Get all stores
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM stores WHERE status != 'deleted' ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.status(500).json({ error: 'Failed to fetch stores' });
    }
});

// Get single store with events
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const storeResult = await pool.query(
            'SELECT * FROM stores WHERE store_id = $1',
            [id]
        );

        if (storeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }

        const eventsResult = await pool.query(
            'SELECT * FROM store_events WHERE store_id = $1 ORDER BY created_at DESC',
            [id]
        );

        res.json({
            store: storeResult.rows[0],
            events: eventsResult.rows
        });
    } catch (error) {
        console.error('Error fetching store:', error);
        res.status(500).json({ error: 'Failed to fetch store' });
    }
});

// Create new store (with quota enforcement)
router.post('/', checkStoreQuota, async (req, res) => {
    try {
        const { name, type = 'woocommerce' } = req.body;
        const userId = req.userId || 'default-user';
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';

        // Validation
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ error: 'Store name must be at least 2 characters' });
        }

        // Check store limit
        const countResult = await pool.query(
            `SELECT COUNT(*) as count FROM stores WHERE status IN ('provisioning', 'ready')`
        );

        if (parseInt(countResult.rows[0].count) >= 10) {
            return res.status(429).json({ error: 'Maximum number of active stores reached (10)' });
        }

        // Generate unique store ID
        const storeId = 'store-' + Math.random().toString(36).substring(2, 10);
        // Generate store URL
        const clusterIp = process.env.CLUSTER_IP || '127.0.0.1';
        const url = `http://${storeId}.${clusterIp}.nip.io:8080`;
        const adminUrl = `${url}/wp-admin`;

        // Insert into database with user tracking and timeout
        const provisioningTimeout = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        const result = await pool.query(
            `INSERT INTO stores (store_id, name, type, status, namespace, url, admin_url, user_id, provisioning_started_at, provisioning_timeout_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, $9) RETURNING *`,
            [storeId, name, type, 'provisioning', storeId, url, adminUrl, userId, provisioningTimeout]
        );

        // Log audit event
        await logAuditEvent(userId, 'store_created', storeId, name, ipAddress, { type, quota: req.quota });

        console.log(`\n🚀 New store creation request: ${storeId} (${name})`);

        // Start provisioning in background (fire and forget)
        orchestrator.provisionStore(storeId, name, type)
            .catch(err => {
                console.error(`Background provisioning error for ${storeId}:`, err);
            });

        res.status(202).json({
            storeId,
            name,
            type,
            status: 'provisioning',
            url
        });
    } catch (error) {
        console.error('Error creating store:', error);
        res.status(500).json({ error: 'Failed to create store' });
    }
});

// Delete store
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || 'default-user';
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM stores WHERE store_id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }

        // Update status to deleting
        await pool.query(
            `UPDATE stores SET status = 'deleting', updated_at = CURRENT_TIMESTAMP WHERE store_id = $1`,
            [id]
        );

        const storeName = result.rows[0].name;

        // Log audit event
        await logAuditEvent(userId, 'store_deleted', id, storeName, ipAddress);

        // Start deletion in background (fire and forget)
        orchestrator.deleteStore(id)
            .catch(err => {
                console.error(`Background deletion error for ${id}:`, err);
            });

        res.json({ message: 'Deletion started', storeId: id });
    } catch (error) {
        console.error('Error deleting store:', error);
        res.status(500).json({ error: 'Failed to delete store' });
    }
});

module.exports = router;
