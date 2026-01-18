# SIMRS-SIMTECH

Hospital Information System (Sistem Informasi Manajemen Rumah Sakit)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)

---

## Features

- Patient Management
- Doctor & Medical Staff Registry
- Medical Specialization Tracking
- Dashboard Analytics
- Hybrid Authentication (Database + Keycloak SSO)

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+ (local or containerized)

### 1. Clone & Configure

```bash
git clone https://github.com/arramandhanu/simrs-simtech.git
cd simrs-simtech
cp .env.template .env
# Edit .env with your database credentials
```

### 2. Run with Docker Compose

**Option A: With containerized PostgreSQL (full stack)**
```bash
docker compose up -d
```

**Option B: With local PostgreSQL**
```bash
docker compose -f docker-compose.local.yml up -d
```

### 3. Access Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4173 |
| Backend API | http://localhost:5000 |
| API Health Check | http://localhost:5000/api/health |

---

## Documentation

| Document | Description |
|----------|-------------|
| [SETUP.md](SETUP.md) | Complete setup guide |
| [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) | PostgreSQL configuration |

---

## Deployment Options

### Docker Compose Files

| File | Use Case |
|------|----------|
| `docker-compose.yml` | Full stack with containerized PostgreSQL |
| `docker-compose.local.yml` | Frontend + Backend only (uses local PostgreSQL) |

### Kubernetes (Kustomize)

```bash
# Deploy backend
kubectl apply -k deployment/backend/overlays/dev

# Deploy frontend
kubectl apply -k deployment/frontend/overlays/dev
```

---

## Project Structure

```
simrs-simtech/
├── src/                    # React/Vite Frontend
├── backend/                # Node.js/Express API
├── deployment/             # Kubernetes manifests
├── docs/                   # Additional documentation
├── docker-compose.yml      # Full stack deployment
├── docker-compose.local.yml # Local PostgreSQL deployment
├── init.sql                # Database schema
└── SETUP.md                # Setup guide
```

---

## Authentication

The application supports two authentication methods:

1. **Database Auth** - Email/password stored in PostgreSQL
2. **Keycloak SSO** - Optional OAuth2/OIDC integration

Set `KEYCLOAK_ENABLED=true` in `.env` to enable SSO.

---

## License

MIT
