const { pool } = require('../config/database');
const helm = require('./helm');
const productGenerator = require('./productGenerator');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class StoreOrchestrator {
    async provisionStore(storeId, storeName) {
        try {
            console.log(`\n🚀 Starting provisioning for ${storeId}...`);
            await this.logEvent(storeId, 'provisioning_started', 'Starting Helm-based store provisioning');
            await this.updateStatus(storeId, 'provisioning', { statusMessage: 'Installing Helm chart...' });

            // Install Helm chart
            const helmResult = await helm.installStore(storeId, storeName);

            if (!helmResult.success) {
                throw new Error('Helm installation failed');
            }

            await this.logEvent(storeId, 'helm_installed', 'Helm chart installed successfully');

            // Get ingress URL
            const ingressHost = `${storeId}.127.0.0.1.nip.io`;
            const storeURL = `http://${ingressHost}:8080`;
            const adminURL = `${storeURL}/wp-admin`;

            // Wait for WordPress pod to be running (not necessarily ready)
            await this.updateStatus(storeId, 'provisioning', { statusMessage: 'Starting WordPress...' });
            await this.logEvent(storeId, 'pod_waiting', 'Waiting for WordPress pod to start');

            const podRunning = await this.waitForWordPressPod(storeId);
            if (!podRunning) {
                throw new Error('WordPress pod failed to start');
            }

            await this.logEvent(storeId, 'pod_running', 'WordPress pod is running');

            // Wait for setup job to complete
            await this.updateStatus(storeId, 'provisioning', { statusMessage: 'Configuring WordPress...' });
            const setupSuccess = await this.waitForSetupJob(storeId);

            if (!setupSuccess) {
                // Don't fail the whole provisioning if setup fails, but log it
                console.error(`⚠️ Setup job failed for ${storeId}`);
                await this.logEvent(storeId, 'setup_failed', 'WordPress setup job failed', 'warning');
            } else {
                await this.logEvent(storeId, 'setup_complete', 'WordPress configured successfully');

                // Generate products
                await this.updateStatus(storeId, 'provisioning', { statusMessage: 'Generating products...' });
                const podName = await this.getWordPressPod(storeId);
                if (podName) {
                    await productGenerator.generateProducts(storeId, podName, storeName);
                    await productGenerator.applyCustomStyles(storeId, podName);
                }
            }

            // Mark store as ready
            await this.updateStatus(storeId, 'ready', {
                url: storeURL,
                adminUrl: adminURL,
                namespace: storeId,
                statusMessage: null
            });

            await this.logEvent(storeId, 'provisioning_complete', `Store ready at ${storeURL}`);
            console.log(`\n✅ PROVISIONING COMPLETE!`);
            console.log(`🎉 Store ${storeId} is ready!`);
            console.log(`🌐 URL: ${storeURL}`);
            console.log(`⚙️  Admin: ${adminURL}`);

            return { success: true, url: storeURL, adminUrl: adminURL };
        } catch (error) {
            console.error(`\n❌ Provisioning failed for ${storeId}:`, error.message);
            await this.updateStatus(storeId, 'failed', { error: error.message, statusMessage: null });
            await this.logEvent(storeId, 'provisioning_failed', error.message, 'error');
            throw error;
        }
    }

    async deleteStore(storeId) {
        try {
            console.log(`\n🗑️  Deleting store ${storeId}...`);
            await this.logEvent(storeId, 'deletion_started', 'Starting store deletion');

            await helm.uninstallStore(storeId);

            await this.updateStatus(storeId, 'deleted');
            await this.logEvent(storeId, 'deletion_complete', 'Store deleted successfully');

            console.log(`✅ Store ${storeId} deleted successfully`);
        } catch (error) {
            console.error(`❌ Failed to delete store ${storeId}:`, error.message);
            await this.logEvent(storeId, 'deletion_failed', error.message, 'error');
            throw error;
        }
    }

    async updateStatus(storeId, status, extra = {}) {
        try {
            const updates = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
            const values = [status];
            let paramIndex = 2;

            if (extra.statusMessage !== undefined) {
                updates.push(`status_message = $${paramIndex}`);
                values.push(extra.statusMessage);
                paramIndex++;
            }

            if (extra.url) {
                updates.push(`url = $${paramIndex}`);
                values.push(extra.url);
                paramIndex++;
            }

            if (extra.adminUrl) {
                updates.push(`admin_url = $${paramIndex}`);
                values.push(extra.adminUrl);
                paramIndex++;
            }

            if (extra.namespace) {
                updates.push(`namespace = $${paramIndex}`);
                values.push(extra.namespace);
                paramIndex++;
            }

            if (extra.error) {
                updates.push(`error = $${paramIndex}`);
                values.push(extra.error);
                paramIndex++;
            }

            values.push(storeId);
            const query = `UPDATE stores SET ${updates.join(', ')} WHERE store_id = $${paramIndex}`;

            await pool.query(query, values);
            console.log(`✅ Status updated: ${storeId} -> ${status}`);
        } catch (error) {
            console.error('Failed to update status:', error.message);
        }
    }

    async logEvent(storeId, eventType, message, severity = 'info') {
        try {
            await pool.query(
                'INSERT INTO store_events (store_id, event_type, message, severity) VALUES ($1, $2, $3, $4)',
                [storeId, eventType, message, severity]
            );
            const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            console.log(`[${timestamp}] 📝 [${storeId}] ${eventType}: ${message}`);
        } catch (error) {
            console.error('Failed to log event:', error.message);
        }
    }

    async waitForWordPressPod(storeId) {
        const maxWait = 10 * 60 * 1000; // Reduced to 10 minutes
        const startTime = Date.now();

        console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] ⏳ Waiting for WordPress pod in ${storeId}...`);

        while (Date.now() - startTime < maxWait) {
            try {
                // Use -o json instead of jsonpath to avoid Windows quoting issues
                const { stdout } = await execAsync(
                    `kubectl get pods -n ${storeId} -l app=wordpress -o json`
                );

                const podData = JSON.parse(stdout);

                if (podData.items && podData.items.length > 0) {
                    const phase = podData.items[0].status.phase;
                    if (phase === 'Running' || phase === 'Succeeded') {
                        console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] ✅ WordPress pod is ${phase}`);
                        return true;
                    }
                }

            } catch (error) {
                // Pod doesn't exist yet or JSON parse error, keep waiting
            }

            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        console.error(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] ❌ WordPress pod failed to start after ${maxWait / 1000}s`);
        return false;
    }

    async waitForSetupJob(storeId) {
        const maxWait = 10 * 60 * 1000; // 10 minutes
        const startTime = Date.now();

        console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] ⏳ Waiting for setup job ${storeId}-setup to complete...`);

        while (Date.now() - startTime < maxWait) {
            try {
                // Use -o json for job status too
                const { stdout } = await execAsync(
                    `kubectl get job ${storeId}-setup -n ${storeId} -o json`
                );

                const jobData = JSON.parse(stdout);

                if (jobData.status && jobData.status.succeeded >= 1) {
                    console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] ✅ Setup job completed successfully`);
                    return true;
                }

                if (jobData.status && jobData.status.failed > 0) {
                    console.error(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] ❌ Setup job failed`);
                    return false;
                }

            } catch (error) {
                // Job doesn't exist yet, keep waiting
            }

            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        console.error(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] ❌ Setup job timed out after ${maxWait / 1000}s`);
        return false;
    }

    async getWordPressPod(namespace) {
        try {
            const { stdout } = await execAsync(
                `kubectl get pods -n ${namespace} -l app=wordpress -o json`
            );
            const podData = JSON.parse(stdout);
            if (podData.items && podData.items.length > 0) {
                return podData.items[0].metadata.name;
            }
            return null;
        } catch (error) {
            console.error(`Failed to get WordPress pod: ${error.message}`);
            return null;
        }
    }

    async waitForPod(namespace, selector, timeout = 300) {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        try {
            console.log(`⏳ Waiting for pod with selector ${selector} in namespace ${namespace}...`);
            const cmd = `kubectl wait --for=condition=ready pod -l ${selector} -n ${namespace} --timeout=${timeout}s`;
            await execAsync(cmd);
            console.log(`✅ Pod is ready!`);
        } catch (error) {
            console.error(`❌ Pod wait timeout: ${error.message}`);
            throw error;
        }
    }

    async getPodName(namespace, selector) {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        try {
            const cmd = `kubectl get pods -n ${namespace} -l ${selector} -o jsonpath="{.items[0].metadata.name}"`;
            const { stdout } = await execAsync(cmd);
            const podName = stdout.trim();
            console.log(`📦 Found pod: ${podName}`);
            return podName;
        } catch (error) {
            console.error(`❌ Failed to get pod name: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new StoreOrchestrator();
