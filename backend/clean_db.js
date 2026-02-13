require('dotenv').config();
const { pool } = require('./config/database');

async function clean() {
    try {
        console.log('Cleaning up ghost stores...');
        const res = await pool.query(
            "DELETE FROM stores WHERE store_id = $1 RETURNING *",
            ['store-sza6bo8v']
        );
        if (res.rows.length > 0) {
            console.log(`Deleted store ${res.rows[0].store_id}`);
        } else {
            console.log('Store not found in DB');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
clean();
