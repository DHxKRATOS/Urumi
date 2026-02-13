# Urumi Store Provisioning Platform

> Kubernetes-based e-commerce store provisioning system for on-demand WooCommerce deployments

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Usage Guide](#usage-guide)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

## Overview

Urumi Store Provisioning Platform enables users to create and manage isolated WooCommerce e-commerce stores on Kubernetes with a single click. Each store runs in its own namespace with dedicated MySQL database and persistent storage.

**Key Capabilities:**
- One-click store creation via React dashboard
- Automatic Kubernetes orchestration using Helm
- Complete isolation between stores using namespaces
- Persistent storage for databases and WordPress content
- Clean resource cleanup on deletion

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
│  React Dashboard │────▶│  Express API    │────▶│  Kubernetes Cluster     │
│  (Port 5173)    │     │  (Port 5000)    │     │                         │
└─────────────────┘     └─────────────────┘     │  ┌───────────────────┐  │
                                                │  │ Namespace: store-1 │  │
                                                │  │  ├─ MySQL         │  │
                                                │  │  ├─ WordPress     │  │
                                                │  │  └─ Ingress       │  │
                                                │  └───────────────────┘  │
                                                │  ┌───────────────────┐  │
                                                │  │ Namespace: store-2 │  │
                                                │  │  ├─ MySQL         │  │
                                                │  │  ├─ WordPress     │  │
                                                │  │  └─ Ingress       │  │
                                                │  └───────────────────┘  │
                                                └─────────────────────────┘
```

### Component Responsibilities

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React + Vite + Tailwind | User interface for store management |
| **Backend** | Node.js + Express | REST API, K8s orchestration |
| **Kubernetes** | k3d (local) / k3s (prod) | Container orchestration |
| **Helm Charts** | Helm v3 | Templated deployments |
| **Store Platform** | WooCommerce | E-commerce functionality |

## Features

- ✅ Create WooCommerce stores on-demand
- ✅ Multi-store support with namespace isolation
- ✅ Persistent storage for databases
- ✅ Real-time status monitoring
- ✅ Clean resource cleanup on deletion
- ✅ Production-ready Helm charts
- ✅ Local and production configurations

## Prerequisites

Ensure you have the following installed:

| Tool | Version | Installation |
|------|---------|--------------|
| Docker | 20.10+ | [Get Docker](https://docs.docker.com/get-docker/) |
| kubectl | 1.25+ | [Install kubectl](https://kubernetes.io/docs/tasks/tools/) |
| Helm | 3.10+ | [Install Helm](https://helm.sh/docs/intro/install/) |
| k3d | 5.0+ | [Install k3d](https://k3d.io/#installation) |
| Node.js | 18+ | [Install Node.js](https://nodejs.org/) |
| Git | 2.0+ | [Install Git](https://git-scm.com/) |

## Local Setup

### Step 1: Navigate to Project

```bash
cd /home/comp-020/Desktop/Urumi
```

### Step 2: Setup Kubernetes Cluster

```bash
chmod +x scripts/*.sh
./scripts/setup-k3d.sh
```

This creates a k3d cluster with:
- Traefik ingress controller
- Ports 80/443 exposed
- 2 agent nodes

### Step 3: Start Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

### Step 4: Start Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### Step 5: Access Dashboard

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage Guide

### Creating a Store

1. Click **"Create New Store"** button
2. Enter a store name (lowercase, alphanumeric, max 20 chars)
3. Select **WooCommerce** platform
4. Click **Create**
5. Wait for status to change from "Provisioning" to "Ready" (~2-3 minutes)

### Accessing Your Store

Once ready, click the store URL (e.g., `http://my-store.localhost`) to:
1. Complete WordPress setup wizard
2. Install WooCommerce plugin
3. Configure your store

### Placing an Order

1. Open store URL
2. Complete WordPress/WooCommerce setup
3. Add products in WooCommerce admin
4. Visit storefront, add items to cart
5. Complete checkout with Cash on Delivery

### Deleting a Store

1. Click **Delete** button on store card
2. Confirm deletion
3. All resources (namespace, pods, PVCs) are automatically cleaned up

## Production Deployment

### Deploying to VPS with k3s

```bash
# On VPS: Install k3s
curl -sfL https://get.k3s.io | sh -

# Copy kubeconfig to local machine
scp user@vps:/etc/rancher/k3s/k3s.yaml ~/.kube/config-prod

# Deploy with production values
helm install store-1 ./helm-charts/woocommerce-store \
  -f helm-charts/woocommerce-store/values-prod.yaml \
  --set storeName=store-1 \
  --set ingress.host=store1.yourdomain.com \
  --kubeconfig ~/.kube/config-prod
```

### Production Differences

| Aspect | Local | Production |
|--------|-------|------------|
| Ingress Host | `*.localhost` | Real domain |
| Storage Class | `local-path` | Cloud provider (gp2, pd-ssd) |
| TLS | Disabled | cert-manager + Let's Encrypt |
| Resources | Minimal | Production-sized |

## Troubleshooting

### Store stuck in "Provisioning"

```bash
# Check pod status
kubectl get pods -n store-<name>

# View pod logs
kubectl logs -f <pod-name> -n store-<name>

# Describe pod for events
kubectl describe pod <pod-name> -n store-<name>
```

### Cannot access store URL

1. Verify ingress is created:
   ```bash
   kubectl get ingress -A
   ```

2. For local development, add to `/etc/hosts`:
   ```
   127.0.0.1 my-store.localhost
   ```

3. Check Traefik is running:
   ```bash
   kubectl get pods -n kube-system | grep traefik
   ```

### Database connection errors

```bash
# Check MySQL pod
kubectl get pods -n store-<name> | grep mysql

# View MySQL logs
kubectl logs <mysql-pod> -n store-<name>

# Verify secrets
kubectl get secrets -n store-<name>
```

### Reset everything

```bash
./scripts/cleanup-k3d.sh
./scripts/setup-k3d.sh
```

## Project Structure

```
Urumi/
├── frontend/                 # React dashboard
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── config/          # Configuration
│   └── package.json
├── backend/                  # Express API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utilities
│   └── package.json
├── helm-charts/
│   └── woocommerce-store/   # Helm chart
│       ├── templates/       # K8s manifests
│       ├── values.yaml      # Default values
│       ├── values-local.yaml
│       └── values-prod.yaml
├── scripts/                  # Setup scripts
│   ├── setup-k3d.sh
│   ├── cleanup-k3d.sh
│   └── test-helm-chart.sh
└── docs/                     # Documentation
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stores` | GET | List all stores |
| `/api/stores` | POST | Create a new store |
| `/api/stores/:namespace` | GET | Get store details |
| `/api/stores/:namespace` | DELETE | Delete a store |
| `/api/stores/:namespace/health` | GET | Get store health |
| `/health` | GET | API health check |

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[SETUP.md](docs/SETUP.md)** - Detailed setup instructions and prerequisites
- **[TESTING.md](docs/TESTING.md)** - Complete test cases and validation steps
- **[SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md)** - Architecture and design decisions
- **[DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)** - Code walkthrough and explanations
- **[COMMANDS.md](docs/COMMANDS.md)** - Useful kubectl and Helm commands
- **[DEMO_VIDEO_SCRIPT.md](docs/DEMO_VIDEO_SCRIPT.md)** - Video demonstration script

## Demo Video

📹 **[Watch the Demo Video](#)** *(Add your video link here)*

The demo video covers:
- Architecture overview and component explanation
- Live demonstration of store creation
- Accessing and configuring a WooCommerce store
- Placing an order through the storefront
- Store deletion and resource cleanup
- Code walkthrough of key components

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built for Urumi AI SDE Internship Assessment - Round 1**
