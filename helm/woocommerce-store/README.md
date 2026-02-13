# WooCommerce Store Helm Chart

This Helm chart deploys a complete WooCommerce store with MySQL database on Kubernetes.

## Features

- ✅ MySQL 8.0 database with persistent storage
- ✅ WordPress 6.4 with WooCommerce
- ✅ Resource limits and quotas
- ✅ Health checks (liveness & readiness probes)
- ✅ RBAC with least privilege
- ✅ Ingress with optional TLS
- ✅ Production-ready configuration

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- NGINX Ingress Controller
- (Optional) cert-manager for TLS

## Installation

### Local Development (Kind)

```bash
# Create namespace
kubectl create namespace store-abc123

# Install chart
helm install my-store ./helm/woocommerce-store \
  --namespace store-abc123 \
  --set storeId=store-abc123 \
  --set storeName="My Test Store" \
  --set mysql.rootPassword="secure-root-pass" \
  --set mysql.password="secure-wp-pass"
```

### Production (VPS with k3s)

```bash
# Create namespace
kubectl create namespace store-abc123

# Install chart with production values
helm install my-store ./helm/woocommerce-store \
  --namespace store-abc123 \
  --values ./helm/woocommerce-store/values-production.yaml \
  --set storeId=store-abc123 \
  --set storeName="Production Store" \
  --set mysql.rootPassword="$(openssl rand -base64 32)" \
  --set mysql.password="$(openssl rand -base64 32)" \
  --set ingress.host="store-abc123.yourdomain.com"
```

## Configuration

See `values.yaml` for all configuration options.

### Key Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `storeName` | Store display name | `My WooCommerce Store` |
| `storeId` | Unique store identifier | `store-default` |
| `mysql.storage.size` | MySQL PVC size | `5Gi` |
| `wordpress.storage.size` | WordPress PVC size | `10Gi` |
| `mysql.resources.limits.memory` | MySQL memory limit | `1Gi` |
| `wordpress.resources.limits.memory` | WordPress memory limit | `512Mi` |
| `ingress.host` | Ingress hostname | `{{ .Values.storeId }}.127.0.0.1.nip.io` |
| `ingress.tls.enabled` | Enable TLS | `false` |
| `resourceQuota.enabled` | Enable namespace quotas | `true` |

## Upgrading

```bash
helm upgrade my-store ./helm/woocommerce-store \
  --namespace store-abc123 \
  --reuse-values
```

## Rollback

```bash
# List releases
helm history my-store --namespace store-abc123

# Rollback to previous version
helm rollback my-store --namespace store-abc123
```

## Uninstalling

```bash
helm uninstall my-store --namespace store-abc123
kubectl delete namespace store-abc123
```

## Security

- Secrets are stored in Kubernetes Secrets
- RBAC with least privilege (read-only access to pods/services)
- Resource quotas prevent resource exhaustion
- Health checks ensure pod reliability
- Optional TLS for production

## Production Checklist

- [ ] Set strong MySQL passwords via `--set`
- [ ] Configure real domain in `ingress.host`
- [ ] Enable TLS with cert-manager
- [ ] Adjust resource limits based on load
- [ ] Configure backup strategy for PVCs
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure log aggregation
