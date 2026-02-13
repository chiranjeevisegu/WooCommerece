require('dotenv').config();
const { pool } = require('./config/database');
const productGenerator = require('./services/productGenerator');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const STORE_ID = 'store-osh805ft';
const STORE_URL = `http://${STORE_ID}.127.0.0.1.nip.io:8080`;

async function rescueStore() {
    console.log(`\n🚑 Rescuing ${STORE_ID}...`);

    try {
        // 1. Get Store Name
        const res = await pool.query("SELECT name FROM stores WHERE store_id = $1", [STORE_ID]);
        const STORE_NAME = res.rows[0]?.name || 'Generic Store';
        console.log(`🏪 Store Name: ${STORE_NAME}`);

        // 2. Create Maintenance Pod for Setup
        const podName = `${STORE_ID}-rescue-setup`;
        await productGenerator.createMaintenancePod(STORE_ID, podName);
        console.log('✅ Maintenance pod created');

        const wp = `kubectl exec -n ${STORE_ID} ${podName} -- wp`;

        /*
        // 3. Run Setup Commands
        console.log('\n🔧 Installing WordPress Core...');
        try {
            await execAsync(`${wp} core install --url="${STORE_URL}" --title="${STORE_NAME}" --admin_user=admin --admin_password=Admin@123 --admin_email=admin@store.local --skip-email --allow-root`);
            console.log('✅ Core installed');
        } catch (e) {
            console.log('⚠️  Core install failed (might be already installed):', e.message.split('\n')[0]);
        }

        console.log('\n⬆️ Updating WordPress Core...');
        try {
            await execAsync(`${wp} core update --allow-root`);
            console.log('✅ Core updated');
        } catch (e) {
            console.log('⚠️  Core update failed:', e.message.split('\n')[0]);
        }

        console.log('\n🛍️ Installing WooCommerce...');
        await execAsync(`${wp} plugin install woocommerce --activate --allow-root`);

        console.log('\n🎨 Installing Storefront Theme...');
        await execAsync(`${wp} theme install storefront --activate --allow-root`);

        console.log('\n⚙️ Configuring Settings...');
        await execAsync(`${wp} option update woocommerce_store_address "123 Fashion Street" --allow-root`);
        await execAsync(`${wp} option update woocommerce_currency "INR" --allow-root`);
        await execAsync(`${wp} rewrite structure '/%postname%/' --allow-root`);
        await execAsync(`${wp} rewrite flush --allow-root`);

        // 4. Cleanup Setup Pod
        await productGenerator.deleteMaintenancePod(STORE_ID, podName);
        */

        // 5. Generate Products & Styles (creates its own pod)
        console.log('\n📦 Generating Products...');
        await productGenerator.generateProducts(STORE_ID, 'ignored', STORE_NAME);
        await productGenerator.applyCustomStyles(STORE_ID, 'ignored');

        // 6. Update Status
        await pool.query(
            "UPDATE stores SET status = 'ready', status_message = NULL, error = NULL WHERE store_id = $1",
            [STORE_ID]
        );

        console.log('\n✨ Rescue complete! Store should be working now.');

    } catch (e) {
        console.error('❌ Rescue failed:', e);
    } finally {
        await pool.end();
        // Try to cleanup just in case
        try {
            await productGenerator.deleteMaintenancePod(STORE_ID, `${STORE_ID}-rescue-setup`);
        } catch (e) { }
    }
}

rescueStore();
