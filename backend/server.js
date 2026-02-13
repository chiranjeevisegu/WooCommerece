require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB, pool } = require('./config/database');
const storesRouter = require('./services/stores');
const auditRouter = require('./services/audit');
const observabilityRouter = require('./services/observability');
const timeoutMonitor = require('./services/timeoutMonitor');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001'
}));
app.use(express.json());

// Routes - no authentication required
app.use('/api/stores', storesRouter);
app.use('/api/audit', auditRouter);
app.use('/api/observability', observabilityRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API info endpoint (public)
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Store Provisioning Platform API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            info: 'GET /api/info',
            metrics: 'GET /api/metrics',
            stores: 'GET /api/stores',
            createStore: 'POST /api/stores',
            deleteStore: 'DELETE /api/stores/:id'
        }
    });
});

// Metrics endpoint
app.get('/api/metrics', async (req, res) => {
    try {
        const totalResult = await pool.query(
            `SELECT COUNT(*) as count FROM stores WHERE status != 'deleted'`
        );

        const activeResult = await pool.query(
            `SELECT COUNT(*) as count FROM stores WHERE status = 'ready'`
        );

        const provisioningResult = await pool.query(
            `SELECT COUNT(*) as count FROM stores WHERE status LIKE '%ing%'`
        );

        const failedResult = await pool.query(
            `SELECT COUNT(*) as count FROM stores WHERE status = 'failed'`
        );

        res.json({
            total: parseInt(totalResult.rows[0].count),
            active: parseInt(activeResult.rows[0].count),
            provisioning: parseInt(provisioningResult.rows[0].count),
            failed: parseInt(failedResult.rows[0].count)
        });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

// Start server
async function start() {
    try {
        console.log('\n⚡ Store Platform Backend Starting...\n');
        console.log('Configuration:');
        console.log(`  PORT: ${PORT}`);
        console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
        console.log(`  DB_HOST: ${process.env.DB_HOST}`);
        console.log(`  DB_PORT: ${process.env.DB_PORT}`);
        console.log(`  DB_NAME: ${process.env.DB_NAME}`);
        console.log(`  CLUSTER_IP: ${process.env.CLUSTER_IP}`);
        console.log(`  CORS_ORIGIN: ${process.env.CORS_ORIGIN}\n`);

        await initDB();

        // Start provisioning timeout monitor
        timeoutMonitor.start();

        app.listen(PORT, () => {
            console.log(`\n✅ Server running on http://localhost:${PORT}`);
            console.log(`   API: http://localhost:${PORT}/api/stores`);
            console.log(`   Metrics: http://localhost:${PORT}/api/metrics`);
            console.log(`   API Info: http://localhost:${PORT}/api/info\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

start();
