require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const productGenerator = require('./services/productGenerator');

const STORE_ID = 'store-sza6bo8v';
const STORE_NAME = 'fashion store';
const STORE_URL = `http://${STORE_ID}.127.0.0.1.nip.io:8080`;

async function runCommand(cmd) {
    try {
        console.log(`Executing: ${cmd}`);
        const { stdout } = await execAsync(cmd);
        console.log(stdout);
        return stdout.trim();
    } catch (error) {
        console.error(`Command failed: ${error.message}`);
        // Continue even if fail, as some might already be done
    }
}

async function manualSetup() {
    console.log(`\n🚀 Starting manual setup for ${STORE_ID} using Maintenance Pod...`);

    // 1. Create Maintenance Pod
    console.log('🛠️  Creating maintenance pod...');
    await runCommand(`kubectl apply -f maintenance.yaml`);

    // 2. Wait for Pod to be Ready
    console.log('⏳ Waiting for maintenance pod to be ready...');
    let ready = false;
    for (let i = 0; i < 60; i++) {
        const status = await runCommand(`kubectl get pod store-sza6bo8v-maintenance -n ${STORE_ID} -o jsonpath="{.status.phase}"`);
        if (status === 'Running') {
            ready = true;
            break;
        }
        await new Promise(r => setTimeout(r, 2000));
    }

    if (!ready) {
        console.error('❌ Maintenance pod failed to start');
        return;
    }
    console.log('✅ Maintenance pod is running');

    const wp = `kubectl exec -n ${STORE_ID} store-sza6bo8v-maintenance -- wp`;
    const podName = 'store-sza6bo8v-maintenance'; // For productGenerator to use (it will exec into this)

    try {
        // 3. Core Install
        console.log('\n🔧 Installing WordPress Core...');
        await runCommand(`${wp} core install --url="${STORE_URL}" --title="${STORE_NAME}" --admin_user=admin --admin_password=Admin@123 --admin_email=admin@store.local --skip-email --allow-root`);

        // 4. Install WooCommerce
        console.log('\n🛍️ Installing WooCommerce...');
        await runCommand(`${wp} plugin install woocommerce --activate --allow-root`);

        // 5. Install Theme
        console.log('\n🎨 Installing Storefront Theme...');
        await runCommand(`${wp} theme install storefront --activate --allow-root`);

        // 6. Configure Basic Settings
        console.log('\n⚙️ Configuring Settings...');
        await runCommand(`${wp} option update woocommerce_store_address "123 Fashion Street" --allow-root`);
        await runCommand(`${wp} option update woocommerce_currency "INR" --allow-root`);
        await runCommand(`${wp} rewrite structure '/%postname%/' --allow-root`);
        await runCommand(`${wp} rewrite flush --allow-root`);

        // 7. Generate Products
        console.log('\n📦 Generating Products...');
        // Note: productGenerator might fail if it tries to exec into 'store-sza6bo8v-maintenance' but expects 'wp' to be in path (which it is for this image!)
        // We need to pass the MAINTENANCE pod name to it.
        await productGenerator.generateProducts(STORE_ID, podName, STORE_NAME);

        // 8. Apply Styles
        console.log('\n💅 Applying Custom Styles...');
        await productGenerator.applyCustomStyles(STORE_ID, podName);

        console.log('\n✅ Manual setup complete!');

    } catch (e) {
        console.error('❌ Setup failed:', e);
    } finally {
        // 9. Cleanup
        console.log('\n🧹 Deleting maintenance pod...');
        await runCommand(`kubectl delete -f maintenance.yaml --wait=false`);
    }
}

manualSetup();
