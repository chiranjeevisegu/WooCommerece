# ⚡ Store Provisioning Platform

A complete Kubernetes-based platform for provisioning WooCommerce stores with a single click.

## 🎯 What This Does

- **User clicks "Create Store"** → Platform automatically provisions a fully functional WooCommerce store
- **2-5 minutes later** → Store is ready at `http://store-{id}.127.0.0.1.nip.io`
- **Fully configured** → Products, payment methods, admin access, everything ready to use

## 🛠️ Tech Stack

- **Backend**: Node.js 18 + Express + PostgreSQL 15
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3
- **Infrastructure**: Kubernetes (Kind) + Docker
- **Per-Store**: MySQL 8.0 + WordPress 6.4 + WooCommerce

## 📋 Prerequisites

Before you begin, install these tools:

1. **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
2. **Node.js 18+** - [Download](https://nodejs.org/)
3. **Kind** - [Installation Guide](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
   ```bash
   # Windows (PowerShell as Admin)
   choco install kind
   
   # Or download from: https://github.com/kubernetes-sigs/kind/releases
   ```
4. **kubectl** - [Installation Guide](https://kubernetes.io/docs/tasks/tools/)
   ```bash
   # Windows (PowerShell as Admin)
   choco install kubernetes-cli
   ```

## 🚀 Quick Start

### Step 1: Start PostgreSQL

```bash
docker compose up -d
```

### Step 2: Create Kind Cluster

```bash
kind create cluster --config kind-config.yaml
```

### Step 3: Install NGINX Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

Wait for ingress to be ready:
```bash
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=300s
```

### Step 4: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Dashboard:**
```bash
cd dashboard
npm install
```

### Step 5: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Dashboard:**
```bash
cd dashboard
npm run dev
```

### Step 6: Open Dashboard

Open your browser to: **http://localhost:3001**

## 🎮 Usage

1. Click **"+ Create Store"**
2. Enter a store name (e.g., "My Coffee Shop")
3. Click **"🚀 Create Store"**
4. Wait 2-5 minutes while watching the status
5. Click **"🛒 Open Store"** when ready
6. Admin login: `admin` / `Admin@123`

## 🔍 Verification Commands

```bash
# Check Kind cluster
kind get clusters

# Check ingress controller
kubectl get pods -n ingress-nginx

# Check PostgreSQL
docker ps

# Check backend API
curl http://localhost:3000/health

# Watch Kubernetes resources in real-time
kubectl get pods --all-namespaces --watch

# List all stores
kubectl get namespaces | grep store-
```

## 📁 Project Structure

```
store-platform/
├── backend/
│   ├── package.json
│   ├── .env
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   └── services/
│       ├── kubernetesClient.js   # Kubernetes API wrapper
│       ├── orchestrator.js        # Provisioning logic
│       └── stores.js              # Express routes
│
├── dashboard/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── index.css
│       └── App.jsx                # Complete React UI
│
├── kind-config.yaml               # Kubernetes cluster config
├── docker-compose.yml             # PostgreSQL config
└── setup.sh                       # Automated setup script
```

## 🏗️ Architecture

```
User Browser (React Dashboard)
        ↓
Backend API (Express)
        ↓
   ┌────┴────┐
   ↓         ↓
PostgreSQL  Kubernetes Cluster (Kind)
(Metadata)       ↓
            ┌────┴────┐
            ↓         ↓
      Namespace 1  Namespace 2
      - MySQL      - MySQL
      - WordPress  - WordPress
      - Ingress    - Ingress
```

## 🔧 Configuration

### Backend (.env)
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=store_platform
DB_USER=postgres
DB_PASSWORD=postgres
CLUSTER_IP=127.0.0.1
CORS_ORIGIN=http://localhost:3001
```

### Dashboard (vite.config.js)
```javascript
server: {
  port: 3001,
  proxy: {
    '/api': { target: 'http://localhost:3000' }
  }
}
```

## 🐛 Troubleshooting

### PostgreSQL Connection Error
```bash
# Restart PostgreSQL
docker compose down
docker compose up -d
```

### Kind Cluster Not Found
```bash
# Recreate cluster
kind delete cluster --name store-platform
kind create cluster --config kind-config.yaml
```

### Ingress Not Working
```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Reinstall if needed
kubectl delete namespace ingress-nginx
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

### Store Stuck in "Provisioning"
```bash
# Check pod status
kubectl get pods -n store-{id}

# Check pod logs
kubectl logs -n store-{id} -l app=woocommerce

# Check events
kubectl get events -n store-{id} --sort-by='.lastTimestamp'
```

## 🧪 Testing

### Create a Test Store via API
```bash
curl -X POST http://localhost:3000/api/stores \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Store","type":"woocommerce"}'
```

### List All Stores
```bash
curl http://localhost:3000/api/stores
```

### Get Metrics
```bash
curl http://localhost:3000/api/metrics
```

## 🗑️ Cleanup

### Delete a Store
The dashboard has a delete button, or use the API:
```bash
curl -X DELETE http://localhost:3000/api/stores/{store-id}
```

### Delete Everything
```bash
# Stop backend and dashboard (Ctrl+C in terminals)

# Delete Kind cluster
kind delete cluster --name store-platform

# Stop PostgreSQL
docker compose down

# Remove PostgreSQL data
docker compose down -v
```

## 📊 Features

- ✅ One-click store provisioning
- ✅ Real-time status updates (5-second polling)
- ✅ Isolated Kubernetes namespaces per store
- ✅ Automatic WooCommerce configuration
- ✅ Pre-installed sample products
- ✅ Cash on Delivery payment enabled
- ✅ Admin credentials auto-configured
- ✅ Automatic DNS via nip.io
- ✅ Dark theme dashboard
- ✅ Store metrics and monitoring
- ✅ Event logging per store

## 🔐 Default Credentials

**WordPress Admin:**
- Username: `admin`
- Password: `Admin@123`
- URL: `http://store-{id}.127.0.0.1.nip.io/wp-admin`

**PostgreSQL:**
- Host: `localhost:5432`
- Database: `store_platform`
- User: `postgres`
- Password: `postgres`

## 🚦 Store Lifecycle

1. **Provisioning** (2-5 minutes)
   - Create namespace
   - Deploy MySQL
   - Deploy WordPress
   - Configure WooCommerce
   - Create ingress

2. **Ready**
   - Store accessible via URL
   - Admin panel available
   - Products created
   - Payment methods enabled

3. **Deleting**
   - Remove namespace
   - Clean up all resources
   - Update database status

## 📈 Scaling

- **Maximum stores**: 10 (configurable in `backend/services/stores.js`)
- **Per-store resources**:
  - MySQL: 256Mi-512Mi RAM, 100m-500m CPU
  - WordPress: 256Mi-512Mi RAM, 100m-500m CPU
  - Storage: 5Gi (MySQL) + 10Gi (WordPress)

## 🎓 Learning Resources

- [Kubernetes Basics](https://kubernetes.io/docs/tutorials/kubernetes-basics/)
- [Kind Documentation](https://kind.sigs.k8s.io/)
- [WooCommerce Docs](https://woocommerce.com/documentation/)
- [WP-CLI Commands](https://developer.wordpress.org/cli/commands/)

## 📝 License

MIT

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your needs.

## ⚠️ Production Considerations

This setup is for **local development and learning**. For production:

- Use managed Kubernetes (EKS, GKE, AKS)
- Implement proper authentication
- Use SSL/TLS certificates
- Set up monitoring and logging
- Implement backup strategies
- Use secrets management (Vault, etc.)
- Configure resource limits properly
- Implement rate limiting
- Add health checks and auto-scaling
