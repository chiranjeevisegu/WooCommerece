# Store Provisioning Platform - Complete Setup Guide

## Overview
This platform uses **Helm** to deploy WooCommerce stores with production-ready configurations including resource limits, RBAC, and namespace isolation.

---

## Prerequisites
- ✅ Docker Desktop (running)
- ✅ Node.js installed
- ✅ Helm installed
- ✅ kubectl installed
- ✅ Kind installed

---

## Complete Setup Steps

### Step 1: Set Execution Policy
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Step 2: Install Dependencies
```powershell
# Backend dependencies
cd C:\Users\chira\OneDrive\Desktop\Utask\store-platform\backend
npm install

# Dashboard dependencies
cd C:\Users\chira\OneDrive\Desktop\Utask\store-platform\dashboard
npm install
```

### Step 3: Start PostgreSQL Database
```powershell
cd C:\Users\chira\OneDrive\Desktop\Utask\store-platform
docker-compose up -d
```

**Verify:**
```powershell
docker ps | findstr postgres
```

### Step 4: Create Kind Cluster
```powershell
cd C:\Users\chira\OneDrive\Desktop\Utask\store-platform

# Delete old cluster if exists
kind delete cluster --name store-platform

# Create cluster (uses port 8080 to avoid conflicts)
kind create cluster --name store-platform --config kind-config-alt.yaml
```

### Step 5: Install NGINX Ingress Controller
```powershell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress to be ready
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=300s
```

**Verify:**
```powershell
kubectl get pods -n ingress-nginx
```

### Step 6: Start Backend Server (Terminal 1)
```powershell
cd C:\Users\chira\OneDrive\Desktop\Utask\store-platform\backend
npm run dev
```

**Expected output:**
```
✅ Server running on http://localhost:3000
🔐 Authentication: API Key required (X-API-Key header)
```

### Step 7: Start Dashboard (Terminal 2 - New Window)
```powershell
cd C:\Users\chira\OneDrive\Desktop\Utask\store-platform\dashboard
npm run dev
```

**Expected output:**
```
➜  Local:   http://localhost:3001/
```

### Step 8: Open Dashboard
Open browser and go to:
```
http://localhost:3001
```

### Step 9: Create a Store
1. Click **"+ Create Store"**
2. Enter store name (e.g., "My Shop")
3. Click **"Create Store"**
4. Wait 2-5 minutes for Helm to provision
5. Click **"🛒 Open Store"** when ready

Store URL format:
```
http://store-xxxxx.127.0.0.1.nip.io:8080
```

---

## What Helm Deploys

When you create a store, Helm automatically creates:

| Resource | Configuration |
|----------|---------------|
| **MySQL** | 500m CPU, 1Gi RAM, 5Gi storage |
| **WordPress** | 400m CPU, 512Mi RAM, 10Gi storage |
| **RBAC** | ServiceAccount, Role, RoleBinding |
| **ResourceQuota** | 2 CPU, 4Gi RAM, 10 pods per namespace |
| **Ingress** | NGINX with custom domain |
| **Secrets** | MySQL credentials |
| **Health Checks** | Liveness & readiness probes |

---

## Project Structure (Helm-Based)

```
store-platform/
├── backend/
│   ├── services/
│   │   ├── orchestrator.js          ← Helm-based (NEW)
│   │   ├── helm.js                  ← Helm service
│   │   ├── stores.js                ← API routes
│   │   └── orchestrator-old-k8s.js  ← Backup (old K8s API)
│   ├── middleware/
│   │   ├── auth.js                  ← API key authentication
│   │   └── rateLimiter.js           ← Rate limiting
│   └── server.js
├── dashboard/
│   └── src/
│       ├── App.jsx
│       └── api.js                   ← Authenticated API client
├── helm/
│   └── woocommerce-store/          ← Helm chart
│       ├── Chart.yaml
│       ├── values.yaml              ← Local config
│       ├── values-production.yaml   ← Production config
│       └── templates/               ← K8s resource templates
└── kind-config-alt.yaml            ← Kind cluster config (port 8080)
```

---

## Removed Files (Old Kubernetes API)

- ❌ `backend/services/kubernetesClient.js` - Removed
- ❌ `backend/services/orchestrator-helm.js` - Merged into orchestrator.js
- 📦 `backend/services/orchestrator-old-k8s.js` - Backed up

---

## Troubleshooting

### Port 80 Already in Use
Use `kind-config-alt.yaml` (port 8080)

### Backend Won't Start
```powershell
docker ps | findstr postgres
docker-compose up -d
```

### Dashboard Shows "Unauthorized"
Check API keys match in `backend/.env` and `dashboard/src/api.js`

### Store Creation Fails
Check backend terminal for Helm errors

---

## Cleanup

**Delete store:**
```powershell
helm uninstall store-xxxxx -n store-xxxxx
kubectl delete namespace store-xxxxx
```

**Delete cluster:**
```powershell
kind delete cluster --name store-platform
```

---

**Platform now uses Helm for production-ready deployments!** 🚀
