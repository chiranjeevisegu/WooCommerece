require('dotenv').config();
const StoreOrchestrator = require('./services/orchestrator');
const { pool } = require('./config/database');

const orchestrator = require('./services/orchestrator');
const STORE_ID = 'store-cod-test';
const STORE_NAME = 'COD Test Store';

async function run() {
    console.log(`🚀 Provisioning ${STORE_ID} to test COD...`);

    try {
        // 1. Clean up DB just in case
        await pool.query("DELETE FROM stores WHERE store_id = $1", [STORE_ID]);

        // 2. Insert initial record
        await pool.query(
            "INSERT INTO stores (store_id, name, status, user_id) VALUES ($1, $2, $3, $4)",
            [STORE_ID, STORE_NAME, 'provisioning', 'test-user']
        );

        // 3. Provision
        const result = await orchestrator.provisionStore(STORE_ID, STORE_NAME);
        console.log('✅ Provisioning result:', result);

    } catch (e) {
        console.error('❌ Provisioning failed:', e);
    } finally {
        await pool.end();
    }
}

run();
