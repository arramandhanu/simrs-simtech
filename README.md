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

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Development](#development)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Authentication](#authentication)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [React + TypeScript + Vite](#react--typescript--vite)
- [License](#license)

---

## Features

- 🏥 **Patient Management** - Register and track patient records
- 👨‍⚕️ **Doctor & Medical Staff Registry** - Manage healthcare professionals
- 🩺 **Medical Specialization Tracking** - Organize by medical specialties
- 📊 **Dashboard Analytics** - Visual insights and statistics
- 🔐 **Hybrid Authentication** - Database + Keycloak SSO with Google login

---

## Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Running frontend and backend |
| Docker | 24+ | Containerization |
| PostgreSQL | 15+ | Database (local or containerized) |

### 1. Clone & Configure

```bash
git clone https://github.com/arramandhanu/simrs-simtech.git
cd simrs-simtech
cp .env.template .env
# Edit .env with your database credentials
```

### 2. Run with Docker

```bash
# Full stack (with PostgreSQL container)
docker compose up -d

# With local PostgreSQL
docker compose -f docker-compose.local.yml up -d
```

### 3. Access Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4173 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/api/health |

---

## Development

### Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend && npm install
```

### Run Locally

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend
npm run dev
```

### Build & Push Docker Images

```bash
# Build and push both images with git SHA tag
./build.sh

# Build with :latest tag
./build.sh --latest

# Build frontend only
./build.sh --fe-only

# Build backend only
./build.sh --be-only

# Build without pushing
./build.sh --no-push
```

---

## Docker Deployment

### Docker Compose Files

| File | Use Case |
|------|----------|
| `docker-compose.yml` | Production (external PostgreSQL & Keycloak) |
| `docker-compose.local.yml` | Development (includes PostgreSQL) |

### Production Deployment

```bash
# With environment file
docker compose --env-file .env.production up -d

# View logs
docker compose logs -f

# Restart services
docker compose restart simrs-backend simrs-frontend
```

---

## Kubernetes Deployment

Deploy using Kustomize:

```bash
# Create namespace
kubectl create namespace simrs-dev

# Deploy backend
kubectl apply -k deployment/backend/overlays/dev

# Deploy frontend
kubectl apply -k deployment/frontend/overlays/dev

# Check status
kubectl get pods -n simrs-dev
```

---

## Authentication

The application supports two authentication methods:

### 1. Database Auth
Email/password stored in PostgreSQL. Default for all users.

### 2. Keycloak SSO (Optional)
OAuth2/OIDC integration with Google Identity Provider.

```bash
# Enable in .env
KEYCLOAK_ENABLED=true
KEYCLOAK_URL=https://auth.yourdomain.com
KEYCLOAK_REALM=simrs
KEYCLOAK_CLIENT_ID=simrs-app
KEYCLOAK_CLIENT_SECRET=your_secret
```

See [SETUP.md](SETUP.md) for detailed Keycloak configuration.

---

## Project Structure

```
simrs-simtech/
├── src/                        # React/Vite Frontend
│   ├── components/             # Reusable UI components
│   ├── pages/                  # Page components
│   ├── context/                # React context (auth)
│   └── services/               # API services
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── config/            # Database & Keycloak config
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth & RBAC middleware
│   │   └── routes/            # API routes
│   └── Dockerfile             # Backend Docker image
├── deployment/                 # Kubernetes manifests
│   ├── backend/               # Backend Kustomize
│   └── frontend/              # Frontend Kustomize
├── nginx/                      # Nginx configurations
├── Dockerfile                  # Frontend Docker image
├── docker-compose.yml          # Production compose
├── docker-compose.local.yml    # Development compose
├── build.sh                    # Docker build script
├── init.sql                    # Database schema
├── SETUP.md                    # Setup guide
└── .env.template               # Environment template
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [SETUP.md](SETUP.md) | Complete setup and deployment guide |
| [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) | PostgreSQL configuration |
| [docs/KEYCLOAK_SETUP.md](docs/KEYCLOAK_SETUP.md) | Keycloak SSO configuration |

---

## React + TypeScript + Vite

This project uses Vite with React and TypeScript for the frontend.

### Vite Plugins

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) - Babel for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) - SWC for Fast Refresh

### React Compiler

The React Compiler is enabled. See [React Compiler docs](https://react.dev/learn/react-compiler) for more information.

> **Note:** This may impact Vite dev & build performance.

### ESLint Configuration

For production applications, enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

For React-specific lint rules, install:
- [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x)
- [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom)

---

## License

MIT
