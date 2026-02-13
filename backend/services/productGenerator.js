const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const execAsync = promisify(exec);

class ProductGenerator {
    constructor() {
        // Different product sets for different store types
        this.productCategories = {
            electronics: [
                {
                    name: 'Premium Wireless Headphones',
                    price: '199.99',
                    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.'
                },
                {
                    name: 'Smart Fitness Watch',
                    price: '299.99',
                    description: 'Track your fitness goals with GPS, heart rate monitoring, and sleep tracking.'
                },
                {
                    name: '4K Wireless Security Camera',
                    price: '149.99',
                    description: 'Crystal clear 4K video with night vision and motion detection.'
                },
                {
                    name: 'Portable Bluetooth Speaker',
                    price: '89.99',
                    description: 'Waterproof speaker with 360° sound and 20-hour battery.'
                },
                {
                    name: 'Wireless Charging Pad',
                    price: '39.99',
                    description: 'Fast wireless charging for all Qi-enabled devices.'
                },
                {
                    name: 'USB-C Hub Adapter',
                    price: '49.99',
                    description: '7-in-1 hub with HDMI, USB 3.0, SD card reader, and more.'
                }
            ],
            fashion: [
                {
                    name: 'Organic Cotton T-Shirt',
                    price: '29.99',
                    description: 'Comfortable 100% organic cotton t-shirt available in multiple colors.'
                },
                {
                    name: 'Leather Messenger Bag',
                    price: '149.99',
                    description: 'Handcrafted genuine leather messenger bag perfect for work or travel.'
                },
                {
                    name: 'Classic Denim Jeans',
                    price: '79.99',
                    description: 'Premium denim with perfect fit and timeless style.'
                },
                {
                    name: 'Wool Blend Sweater',
                    price: '89.99',
                    description: 'Cozy and warm sweater made from premium wool blend.'
                },
                {
                    name: 'Canvas Sneakers',
                    price: '59.99',
                    description: 'Comfortable everyday sneakers with classic design.'
                },
                {
                    name: 'Silk Scarf',
                    price: '44.99',
                    description: 'Luxurious silk scarf with elegant patterns.'
                }
            ],
            sports: [
                {
                    name: 'Yoga Mat Pro',
                    price: '79.99',
                    description: 'Non-slip premium yoga mat with extra cushioning and carrying strap.'
                },
                {
                    name: 'Adjustable Dumbbells Set',
                    price: '299.99',
                    description: 'Space-saving adjustable dumbbells from 5 to 52.5 lbs.'
                },
                {
                    name: 'Resistance Bands Kit',
                    price: '34.99',
                    description: 'Complete set of 5 resistance bands for full-body workouts.'
                },
                {
                    name: 'Running Shoes',
                    price: '129.99',
                    description: 'Lightweight running shoes with superior cushioning.'
                },
                {
                    name: 'Stainless Steel Water Bottle',
                    price: '34.99',
                    description: 'Eco-friendly insulated water bottle keeps drinks cold for 24 hours.'
                },
                {
                    name: 'Foam Roller',
                    price: '29.99',
                    description: 'High-density foam roller for muscle recovery and massage.'
                }
            ],
            home: [
                {
                    name: 'Ceramic Plant Pot Set',
                    price: '49.99',
                    description: 'Set of 3 modern ceramic planters with drainage holes.'
                },
                {
                    name: 'Aromatherapy Diffuser',
                    price: '39.99',
                    description: 'Ultrasonic essential oil diffuser with LED lights.'
                },
                {
                    name: 'Throw Pillow Set',
                    price: '59.99',
                    description: 'Set of 4 decorative throw pillows with premium covers.'
                },
                {
                    name: 'Wall Art Canvas',
                    price: '89.99',
                    description: 'Modern abstract canvas art print, ready to hang.'
                },
                {
                    name: 'Bamboo Cutting Board',
                    price: '34.99',
                    description: 'Eco-friendly bamboo cutting board with juice groove.'
                },
                {
                    name: 'LED String Lights',
                    price: '24.99',
                    description: 'Warm white fairy lights perfect for any room.'
                }
            ],
            books: [
                {
                    name: 'The Art of Programming',
                    price: '44.99',
                    description: 'Comprehensive guide to modern software development practices.'
                },
                {
                    name: 'Mindfulness Journal',
                    price: '19.99',
                    description: 'Daily journal for meditation and self-reflection.'
                },
                {
                    name: 'Cookbook Collection',
                    price: '34.99',
                    description: '500+ recipes for healthy and delicious meals.'
                },
                {
                    name: 'Business Strategy Guide',
                    price: '39.99',
                    description: 'Essential strategies for building successful businesses.'
                },
                {
                    name: 'Photography Masterclass',
                    price: '49.99',
                    description: 'Learn professional photography techniques step by step.'
                },
                {
                    name: 'Travel Guide Collection',
                    price: '29.99',
                    description: 'Explore the world with detailed travel guides.'
                }
            ],
            beauty: [
                {
                    name: 'Organic Face Serum',
                    price: '49.99',
                    description: 'Vitamin C serum for bright, youthful skin.'
                },
                {
                    name: 'Makeup Brush Set',
                    price: '39.99',
                    description: 'Professional 12-piece makeup brush collection.'
                },
                {
                    name: 'Natural Lip Balm Set',
                    price: '19.99',
                    description: 'Set of 3 organic lip balms with nourishing ingredients.'
                },
                {
                    name: 'Jade Facial Roller',
                    price: '29.99',
                    description: 'Natural jade roller for facial massage and de-puffing.'
                },
                {
                    name: 'Hair Care Gift Set',
                    price: '59.99',
                    description: 'Complete hair care set with shampoo, conditioner, and mask.'
                },
                {
                    name: 'Bath Bomb Collection',
                    price: '24.99',
                    description: 'Set of 6 luxurious bath bombs with essential oils.'
                }
            ]
        };
    }

    detectStoreCategory(storeName) {
        const name = storeName.toLowerCase();

        if (name.includes('tech') || name.includes('electronic') || name.includes('gadget')) {
            return 'electronics';
        } else if (name.includes('fashion') || name.includes('cloth') || name.includes('apparel') || name.includes('style')) {
            return 'fashion';
        } else if (name.includes('sport') || name.includes('fit') || name.includes('gym') || name.includes('athletic')) {
            return 'sports';
        } else if (name.includes('home') || name.includes('garden') || name.includes('decor')) {
            return 'home';
        } else if (name.includes('book') || name.includes('read') || name.includes('library')) {
            return 'books';
        } else if (name.includes('beauty') || name.includes('cosmetic') || name.includes('makeup')) {
            return 'beauty';
        }

        // Default: randomly pick a category
        const categories = Object.keys(this.productCategories);
        const randomIndex = Math.floor(Math.random() * categories.length);
        return categories[randomIndex];
    }

    async generateProducts(namespace, podName, storeName) {
        // podName arg is ignored now, we create our own maintenance pod
        const maintenancePod = `${namespace}-maintenance`;

        try {
            console.log(`\n🛍️  Generating products for ${namespace}...`);

            // 1. Create Maintenance Pod with PVC mount
            await this.createMaintenancePod(namespace, maintenancePod);

            // Detect store category based on name
            const category = this.detectStoreCategory(storeName);
            const products = this.productCategories[category];

            console.log(`📦 Detected category: ${category} (${products.length} products)`);

            for (const product of products) {
                const createProductCmd = `kubectl exec -n ${namespace} ${maintenancePod} -- ` +
                    `wp wc product create ` +
                    `--name="${product.name}" ` +
                    `--type=simple ` +
                    `--regular_price="${product.price}" ` +
                    `--description="${product.description}" ` +
                    `--short_description="${product.description.substring(0, 100)}" ` +
                    `--status=publish ` +
                    `--catalog_visibility=visible ` +
                    `--user=admin ` +
                    `--allow-root`;

                await execAsync(createProductCmd);
                console.log(`✅ Created product: ${product.name}`);
            }

            // Enable Cash on Delivery
            console.log('\n💳 Enabling Cash on Delivery (COD)...');
            const enableCODCmd = `kubectl exec -n ${namespace} ${maintenancePod} -- ` +
                `wp wc payment_gateway update cod --enabled=true --user=admin --allow-root`;
            await execAsync(enableCODCmd);
            console.log('✅ COD Enabled');

            console.log(`\n✅ Generated ${products.length} products successfully!`);
            return { success: true, count: products.length, category };
        } catch (error) {
            console.error('❌ Failed to generate products:', error.message);
            return { success: false, error: error.message };
        } finally {
            await this.deleteMaintenancePod(namespace, maintenancePod);
        }
    }

    async applyCustomStyles(namespace, podName) {
        // podName arg is ignored now, we create our own maintenance pod
        const maintenancePod = `${namespace}-style-job`;

        try {
            console.log(`\n🎨 Applying custom styles to ${namespace}...`);
            await this.createMaintenancePod(namespace, maintenancePod);

            const customCSS = `
/* Modern Store Styling */
:root {
    --primary-color: #7c3aed;
    --secondary-color: #a78bfa;
}

/* Header Styling */
.site-header {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    padding: 1rem 0;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.site-title a {
    color: white !important;
    font-weight: 700;
    font-size: 1.8rem;
}

/* Navigation */
.main-navigation a {
    color: white !important;
    font-weight: 500;
    transition: opacity 0.3s;
}

.main-navigation a:hover {
    opacity: 0.8;
}

/* Product Cards */
.woocommerce ul.products li.product {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: transform 0.3s, box-shadow 0.3s;
}

.woocommerce ul.products li.product:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 12px rgba(124,58,237,0.2);
}

/* Buttons */
.woocommerce a.button, .woocommerce button.button {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-weight: 600;
    transition: transform 0.2s;
}

.woocommerce a.button:hover, .woocommerce button.button:hover {
    transform: scale(1.05);
}

/* Price */
.woocommerce .price {
    color: var(--primary-color);
    font-weight: 700;
    font-size: 1.2rem;
}
`;

            const escapedCSS = customCSS.replace(/"/g, '\\"').replace(/\n/g, ' ');

            const applyCSSCmd = `kubectl exec -n ${namespace} ${maintenancePod} -- ` +
                `wp option update custom_css "${escapedCSS}" --allow-root`;

            await execAsync(applyCSSCmd);
            console.log('✅ Custom styles applied successfully!');

            return { success: true };
        } catch (error) {
            console.error('❌ Failed to apply custom styles:', error.message);
            return { success: false, error: error.message };
        } finally {
            await this.deleteMaintenancePod(namespace, maintenancePod);
        }
    }

    async createMaintenancePod(namespace, podName) {
        console.log(`🛠️  Creating maintenance pod ${podName}...`);

        // Check if already exists and delete
        try {
            await execAsync(`kubectl delete pod ${podName} -n ${namespace} --wait=false`);
        } catch (e) { }

        const yaml = `
apiVersion: v1
kind: Pod
metadata:
  name: ${podName}
  namespace: ${namespace}
spec:
  containers:
  - name: wp-cli
    image: wordpress:cli-2.9-php8.2
    command: ["/bin/sh", "-c", "sleep 3600"]
    env:
    - name: WORDPRESS_DB_HOST
      value: ${namespace}-mysql:3306
    - name: WORDPRESS_DB_NAME
      value: woocommerce
    - name: WORDPRESS_DB_USER
      value: wpuser
    - name: WORDPRESS_DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: ${namespace}-mysql-secret
          key: mysql-password
    - name: WP_CLI_CACHE_DIR
      value: /tmp/wp-cli-cache
    volumeMounts:
    - name: wordpress-data
      mountPath: /var/www/html
    resources:
      limits:
        cpu: 200m
        memory: 512Mi
      requests:
        cpu: 100m
        memory: 256Mi
  securityContext:
    runAsUser: 33
    fsGroup: 33
  volumes:
  - name: wordpress-data
    persistentVolumeClaim:
      claimName: ${namespace}-wordpress-pvc
  restartPolicy: Never
`;
        const tmpFile = path.join(__dirname, `../../temp-${podName}.yaml`);
        fs.writeFileSync(tmpFile, yaml);

        await execAsync(`kubectl apply -f "${tmpFile}"`);

        // Wait for ready
        console.log(`⏳ Waiting for ${podName} to be ready...`);
        for (let i = 0; i < 150; i++) {
            try {
                const { stdout } = await execAsync(`kubectl get pod ${podName} -n ${namespace} -o jsonpath="{.status.phase}"`);
                if (stdout === 'Running') {
                    // Clean up temp file
                    fs.unlinkSync(tmpFile);
                    return;
                }
            } catch (e) { }
            await new Promise(r => setTimeout(r, 2000));
        }
        throw new Error('Maintenance pod failed to start');
    }

    async deleteMaintenancePod(namespace, podName) {
        try {
            console.log(`🧹 Deleting maintenance pod ${podName}...`);
            await execAsync(`kubectl delete pod ${podName} -n ${namespace} --wait=false`);
        } catch (e) {
            console.error(`Failed to cleanup pod ${podName}: `, e.message);
        }
    }
}

module.exports = new ProductGenerator();
