# SIMRS-SIMTECH Setup Guide

A comprehensive guide to setting up and deploying the SIMRS-SIMTECH Hospital Information System.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Environment Configuration](#environment-configuration)
4. [Development Setup](#development-setup)
5. [Docker Deployment](#docker-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Authentication Configuration](#authentication-configuration)
8. [Database Setup](#database-setup)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Running frontend and backend locally |
| Docker | 24+ | Containerizing the application |
| Docker Compose | v2+ | Orchestrating multi-container deployment |
| kubectl | 1.28+ | (Optional) Kubernetes deployment |
| Git | 2.40+ | Version control |

---

## Project Structure

```
simrs-simtech/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js     # PostgreSQL connection
│   │   │   └── keycloak.js     # Keycloak SSO configuration
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Auth middleware
│   │   └── routes/             # API routes
│   ├── Dockerfile              # Backend Docker image
│   └── package.json
├── src/                        # React/Vite Frontend
│   ├── components/             # Reusable UI components
│   ├── pages/                  # Page components
│   │   ├── Login.tsx           # Login page (DB + SSO)
│   │   └── auth/
│   │       └── AuthCallback.tsx # SSO callback handler
│   ├── services/               # API services
│   └── context/                # React context (auth)
├── deployment/                 # Kubernetes manifests
│   ├── frontend/
│   │   ├── base/               # Base Kustomize resources
│   │   └── overlays/dev/       # Environment overlays
│   └── backend/
│       ├── base/
│       └── overlays/dev/
├── Dockerfile                  # Frontend Docker image
├── docker-compose.yml          # Docker Compose config
├── init.sql                    # Database initialization
├── nginx.conf                  # Nginx configuration
├── .env.template               # Environment template
└── package.json
```

---

## Environment Configuration

### Step 1: Create Environment File

Copy the template and configure your values:

```bash
cp .env.template .env
```

### Step 2: Configure Required Variables

Edit `.env` with your actual values:

```bash
# Database (required)
DB_HOST=postgres
DB_USER=simrs_user
DB_PASSWORD=your_secure_password
DB_NAME=simrs_db

# Backend (required)
JWT_SECRET=generate_a_64_character_random_string
FRONTEND_URL=http://localhost:4173

# Frontend (build-time)
VITE_API_BASE_URL=http://localhost:5000/api
```

### Step 3: (Optional) Configure Keycloak SSO

If you want to enable SSO, add these:

```bash
KEYCLOAK_ENABLED=true
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=simrs
KEYCLOAK_CLIENT_ID=simrs-app
KEYCLOAK_CLIENT_SECRET=your_client_secret_from_keycloak
```

---

## Development Setup

### Option A: Run Locally (without Docker)

#### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

#### 2. Install Frontend Dependencies

```bash
cd ..
npm install
```

#### 3. Start PostgreSQL

You need a running PostgreSQL instance. You can use Docker for just the database:

```bash
docker run -d \
  --name simrs-postgres \
  -e POSTGRES_USER=simrs_user \
  -e POSTGRES_PASSWORD=simrs_pass \
  -e POSTGRES_DB=simrs_db \
  -p 5432:5432 \
  -v $(pwd)/init.sql:/docker-entrypoint-initdb.d/init.sql \
  postgres:15-alpine
```

#### 4. Start Backend

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:5000`

#### 5. Start Frontend

In a new terminal:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

## Docker Deployment

### Option A: Run with Docker Compose (Recommended)

#### Basic Setup (Database Auth Only)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

Services will be available at:
- **Frontend**: http://localhost:4173
- **Backend API**: http://localhost:5000
- **PostgreSQL**: localhost:5432

#### With Keycloak SSO

```bash
# Start with Keycloak profile
docker compose --profile keycloak up -d
```

Additional service:
- **Keycloak Admin**: http://localhost:8080 (admin/admin)

### Option B: Build Images Manually

#### Build Frontend Image

```bash
docker build -t simrs-frontend .
```

#### Build Backend Image

```bash
docker build -t simrs-backend ./backend
```

---

## Kubernetes Deployment

### Prerequisites

- kubectl configured with cluster access
- Container registry access (or local images loaded)

### Deploy with Kustomize

#### 1. Build and Push Images

```bash
# Tag and push frontend
docker tag simrs-frontend your-registry/simrs-frontend:v1.0.0
docker push your-registry/simrs-frontend:v1.0.0

# Tag and push backend
docker tag simrs-backend your-registry/simrs-backend:v1.0.0
docker push your-registry/simrs-backend:v1.0.0
```

#### 2. Update Image References

Edit `deployment/frontend/overlays/dev/kustomization.yaml`:

```yaml
images:
- name: simrs-frontend
  newName: your-registry/simrs-frontend
  newTag: v1.0.0
```

Edit `deployment/backend/overlays/dev/kustomization.yaml`:

```yaml
images:
- name: simrs-backend
  newName: your-registry/simrs-backend
  newTag: v1.0.0
```

#### 3. Apply Manifests

```bash
# Create namespace
kubectl create namespace simrs-dev

# Deploy backend
kubectl apply -k deployment/backend/overlays/dev

# Deploy frontend
kubectl apply -k deployment/frontend/overlays/dev
```

#### 4. Verify Deployment

```bash
kubectl get pods -n simrs-dev
kubectl get services -n simrs-dev
```

---

## Authentication Configuration

### Database Authentication

Database authentication is enabled by default. Users are stored in the `users` table.

#### Create a User

Use the API to register:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "admin123",
    "name": "Administrator"
  }'
```

#### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "admin123"
  }'
```

### Keycloak SSO Setup

#### Step 1: Access Keycloak Admin Console

Navigate to http://localhost:8080 and login with:
- Username: `admin`
- Password: `admin`

#### Step 2: Create a Realm

1. Click dropdown (top-left, says "master")
2. Click "Create Realm"
3. Name: `simrs`
4. Click "Create"

#### Step 3: Create a Client

1. Go to Clients → Create client
2. Client ID: `simrs-app`
3. Client authentication: **ON**
4. Click Next
5. Valid redirect URIs: `http://localhost:5000/api/auth/keycloak/callback`
6. Web origins: `http://localhost:4173`
7. Click Save

#### Step 4: Get Client Secret

1. Go to Clients → simrs-app → Credentials
2. Copy the "Client secret"
3. Add to your `.env`: `KEYCLOAK_CLIENT_SECRET=<copied_secret>`

#### Step 5: Create Users in Keycloak

1. Go to Users → Add user
2. Fill in username, email
3. Click Create
4. Go to Credentials tab → Set password

#### Step 6: Enable in Application

Set `KEYCLOAK_ENABLED=true` in your `.env` and restart the backend.

---

## Database Setup

### Schema

The database schema is automatically created via `init.sql` when PostgreSQL starts.

Tables created:
- `users` - User accounts
- `patients` - Patient records
- `dokter` - Doctor records
- `spesialis` - Medical specializations
- `dokter_spesialis` - Doctor-specialization mapping

### Manual Database Access

```bash
# Connect to postgres container
docker exec -it simrs-postgres psql -U simrs_user -d simrs_db

# List tables
\dt

# View users
SELECT id, name, email, role FROM users;
```

### Reset Database

```bash
# Stop containers
docker compose down

# Remove volume
docker volume rm simrs-simtech_postgres_data

# Start fresh
docker compose up -d
```

---

## Troubleshooting

### Backend cannot connect to database

**Symptom**: `Error connecting to database: connection refused`

**Solution**:
1. Ensure PostgreSQL is running: `docker compose ps`
2. Check DB_HOST matches service name (`postgres`)
3. Verify credentials in `.env`

### Frontend shows "Network error"

**Symptom**: API calls fail with network error

**Solution**:
1. Verify backend is running: `curl http://localhost:5000/api/health`
2. Check CORS: `FRONTEND_URL` must match frontend origin
3. Verify `VITE_API_BASE_URL` in frontend build

### Keycloak SSO button not showing

**Symptom**: Login page only shows email/password form

**Solution**:
1. Check `KEYCLOAK_ENABLED=true` in backend environment
2. Restart backend: `docker compose restart simrs-backend`
3. Check browser console for fetch errors to `/api/auth/config`

### Keycloak redirect fails

**Symptom**: "Invalid redirect URI" error

**Solution**:
1. In Keycloak admin → Clients → simrs-app → Settings
2. Verify "Valid redirect URIs" includes your callback URL
3. Verify "Web origins" includes frontend URL

### Container won't start

**Symptom**: Container exits immediately

**Solution**:
```bash
# Check logs
docker compose logs simrs-backend
docker compose logs simrs-frontend

# Common fixes:
# - Missing environment variables
# - Port already in use (change in .env)
# - Build errors (rebuild with --no-cache)
```

---

## Support

For issues and feature requests, please contact the development team or create an issue in the repository.
