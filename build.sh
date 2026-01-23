<<<<<<< HEAD
#!/usr/bin/env bash
# ==============================================
# SIMRS Build & Push Script (Docker Build Cloud)
# ==============================================
# Uses Docker Build Cloud (buildx) and tags with git commit SHA
#
# Usage:
#   ./build.sh              # Build and push both images
#   ./build.sh --no-push    # Build only (no push)
#   ./build.sh --latest     # Also tag as latest
#   ./build.sh --fe-only    # Build frontend only
#   ./build.sh --be-only    # Build backend only
#   ./build.sh --no-cache   # Force fresh build

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${APP_DIR}"

# =========================
# Configuration
# =========================
=======
#!/bin/bash
# ==============================================
# SIMRS Build & Push Script
# ==============================================
# Uses Docker Cloud Build and tags with git commit SHA
#
# Usage:
#   ./build.sh              # Build and push
#   ./build.sh --no-push    # Build only
#   ./build.sh --latest     # Also tag as latest

set -e

# Configuration
>>>>>>> 5bee8b3 (feat: add RBAC, Google login, logging, and build script)
DOCKER_REPO="aryaramandhanu/simrs-simtech"
FRONTEND_IMAGE="${DOCKER_REPO}-fe"
BACKEND_IMAGE="${DOCKER_REPO}-be"

<<<<<<< HEAD
# Cloud builder
BUILDX_CLOUD_GROUP="${BUILDX_CLOUD_GROUP:-aryaramandhanu/barong}"
BUILDER_NAME="${BUILDER_NAME:-cloud-aryaramandhanu-barong}"
PLATFORMS="${PLATFORMS:-linux/amd64}"

# Cache
FRONTEND_CACHE_REF="${FRONTEND_IMAGE}:buildcache"
BACKEND_CACHE_REF="${BACKEND_IMAGE}:buildcache"

# Git info
GIT_SHA="$(git rev-parse --short=7 HEAD)"
GIT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
=======
# Get git commit SHA
GIT_SHA=$(git rev-parse --short HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
>>>>>>> 5bee8b3 (feat: add RBAC, Google login, logging, and build script)

# Production API URL
VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://simrs.ramandhanu.cloud/api}"

<<<<<<< HEAD
# DockerHub
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:-aryaramandhanu}"
DOCKERHUB_TOKEN="${DOCKERHUB_TOKEN:-}"

=======
>>>>>>> 5bee8b3 (feat: add RBAC, Google login, logging, and build script)
# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

<<<<<<< HEAD
# =========================
# Parse arguments
# =========================
PUSH=true
TAG_LATEST=false
BUILD_FRONTEND=true
BUILD_BACKEND=true
NO_CACHE=false

=======
# Parse arguments
PUSH=true
TAG_LATEST=false
>>>>>>> 5bee8b3 (feat: add RBAC, Google login, logging, and build script)
for arg in "$@"; do
    case $arg in
        --no-push) PUSH=false ;;
        --latest) TAG_LATEST=true ;;
<<<<<<< HEAD
        --fe-only) BUILD_BACKEND=false ;;
        --be-only) BUILD_FRONTEND=false ;;
        --no-cache) NO_CACHE=true ;;
    esac
done

# =========================
# Header
# =========================
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  SIMRS SIMTECH - Docker Build Cloud${NC}"
=======
    esac
done

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  SIMRS SIMTECH - Docker Build${NC}"
>>>>>>> 5bee8b3 (feat: add RBAC, Google login, logging, and build script)
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "${YELLOW}Git SHA:${NC}    ${GIT_SHA}"
echo -e "${YELLOW}Branch:${NC}     ${GIT_BRANCH}"
echo -e "${YELLOW}API URL:${NC}    ${VITE_API_BASE_URL}"
<<<<<<< HEAD
echo -e "${YELLOW}Builder:${NC}    ${BUILDER_NAME}"
echo ""

# =========================
# Docker login
# =========================
if [[ -n "${DOCKERHUB_TOKEN:-}" ]]; then
    echo -e "${GREEN}[INFO] DockerHub login for ${DOCKERHUB_USERNAME}${NC}"
    echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
fi

# =========================
# Setup cloud builder
# =========================
echo -e "${GREEN}[INFO] Setting up cloud builder...${NC}"
if ! docker buildx ls | awk '{print $1}' | grep -qx "${BUILDER_NAME}\*"; then
    if ! docker buildx ls | awk '{print $1}' | grep -qx "${BUILDER_NAME}"; then
        echo -e "${YELLOW}[WARN] Builder ${BUILDER_NAME} not found. Creating...${NC}"
        docker buildx create --driver cloud "${BUILDX_CLOUD_GROUP}" >/dev/null || true
    fi
fi
docker buildx use "${BUILDER_NAME}"

# =========================
# Build Frontend
# =========================
if [ "$BUILD_FRONTEND" = true ]; then
    echo ""
    echo -e "${GREEN}[1/2] Building Frontend via Docker Build Cloud...${NC}"
    
    BUILD_ARGS=(
        --builder "${BUILDER_NAME}"
        --platform "${PLATFORMS}"
        --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL}"
        -t "${FRONTEND_IMAGE}:${GIT_SHA}"
        -f Dockerfile
    )
    
    if [ "$NO_CACHE" != true ]; then
        BUILD_ARGS+=(--cache-from "type=registry,ref=${FRONTEND_CACHE_REF}")
        BUILD_ARGS+=(--cache-to "type=registry,ref=${FRONTEND_CACHE_REF},mode=max")
    else
        BUILD_ARGS+=(--no-cache)
    fi
    
    if [ "$TAG_LATEST" = true ]; then
        BUILD_ARGS+=(-t "${FRONTEND_IMAGE}:latest")
    fi
    
    if [ "$PUSH" = true ]; then
        BUILD_ARGS+=(--push)
    else
        BUILD_ARGS+=(--load)
    fi
    
    # Build from root directory with root Dockerfile
    docker buildx build "${BUILD_ARGS[@]}" .
    
    echo -e "${GREEN}  ✓ Frontend built: ${FRONTEND_IMAGE}:${GIT_SHA}${NC}"
fi

# =========================
# Build Backend
# =========================
if [ "$BUILD_BACKEND" = true ]; then
    echo ""
    echo -e "${GREEN}[2/2] Building Backend via Docker Build Cloud...${NC}"
    
    BUILD_ARGS=(
        --builder "${BUILDER_NAME}"
        --platform "${PLATFORMS}"
        -t "${BACKEND_IMAGE}:${GIT_SHA}"
        -f backend/Dockerfile
    )
    
    if [ "$NO_CACHE" != true ]; then
        BUILD_ARGS+=(--cache-from "type=registry,ref=${BACKEND_CACHE_REF}")
        BUILD_ARGS+=(--cache-to "type=registry,ref=${BACKEND_CACHE_REF},mode=max")
    else
        BUILD_ARGS+=(--no-cache)
    fi
    
    if [ "$TAG_LATEST" = true ]; then
        BUILD_ARGS+=(-t "${BACKEND_IMAGE}:latest")
    fi
    
    if [ "$PUSH" = true ]; then
        BUILD_ARGS+=(--push)
    else
        BUILD_ARGS+=(--load)
    fi
    
    # Build from backend directory with backend/Dockerfile
    docker buildx build "${BUILD_ARGS[@]}" backend/
    
    echo -e "${GREEN}  ✓ Backend built: ${BACKEND_IMAGE}:${GIT_SHA}${NC}"
fi

# =========================
# Update docker-compose.yml
# =========================
echo ""
echo -e "${GREEN}Updating docker-compose.yml with new tags...${NC}"

UPDATE_TAG="${GIT_SHA}"
if [ "$TAG_LATEST" = true ]; then
    UPDATE_TAG="latest"
fi

if [ "$BUILD_FRONTEND" = true ]; then
    sed -i.bak "s|image: ${FRONTEND_IMAGE}:.*|image: ${FRONTEND_IMAGE}:${UPDATE_TAG}|g" docker-compose.yml
    sed -i.bak "s|image: ${FRONTEND_IMAGE}:.*|image: ${FRONTEND_IMAGE}:${UPDATE_TAG}|g" docker-compose.local.yml 2>/dev/null || true
fi

if [ "$BUILD_BACKEND" = true ]; then
    sed -i.bak "s|image: ${BACKEND_IMAGE}:.*|image: ${BACKEND_IMAGE}:${UPDATE_TAG}|g" docker-compose.yml
    sed -i.bak "s|image: ${BACKEND_IMAGE}:.*|image: ${BACKEND_IMAGE}:${UPDATE_TAG}|g" docker-compose.local.yml 2>/dev/null || true
fi

rm -f docker-compose.yml.bak docker-compose.local.yml.bak

echo -e "${GREEN}  ✓ Updated docker-compose.yml to use tag: ${UPDATE_TAG}${NC}"

# =========================
# Summary
# =========================
=======
echo ""

# Build Frontend
echo -e "${GREEN}[1/4] Building Frontend...${NC}"
docker build \
    --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
    -t "${FRONTEND_IMAGE}:${GIT_SHA}" \
    -f Dockerfile \
    .

if [ "$TAG_LATEST" = true ]; then
    docker tag "${FRONTEND_IMAGE}:${GIT_SHA}" "${FRONTEND_IMAGE}:latest"
    echo -e "${GREEN}      Tagged as ${FRONTEND_IMAGE}:latest${NC}"
fi

# Build Backend
echo -e "${GREEN}[2/4] Building Backend...${NC}"
docker build \
    -t "${BACKEND_IMAGE}:${GIT_SHA}" \
    -f backend/Dockerfile \
    backend/

if [ "$TAG_LATEST" = true ]; then
    docker tag "${BACKEND_IMAGE}:${GIT_SHA}" "${BACKEND_IMAGE}:latest"
    echo -e "${GREEN}      Tagged as ${BACKEND_IMAGE}:latest${NC}"
fi

# Push images
if [ "$PUSH" = true ]; then
    echo -e "${GREEN}[3/4] Pushing Frontend...${NC}"
    docker push "${FRONTEND_IMAGE}:${GIT_SHA}"
    if [ "$TAG_LATEST" = true ]; then
        docker push "${FRONTEND_IMAGE}:latest"
    fi

    echo -e "${GREEN}[4/4] Pushing Backend...${NC}"
    docker push "${BACKEND_IMAGE}:${GIT_SHA}"
    if [ "$TAG_LATEST" = true ]; then
        docker push "${BACKEND_IMAGE}:latest"
    fi
else
    echo -e "${YELLOW}[3/4] Skipping push (--no-push)${NC}"
    echo -e "${YELLOW}[4/4] Skipping push (--no-push)${NC}"
fi

>>>>>>> 5bee8b3 (feat: add RBAC, Google login, logging, and build script)
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Build Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${BLUE}Images built:${NC}"
<<<<<<< HEAD
[ "$BUILD_FRONTEND" = true ] && echo -e "  Frontend: ${FRONTEND_IMAGE}:${GIT_SHA}"
[ "$BUILD_BACKEND" = true ] && echo -e "  Backend:  ${BACKEND_IMAGE}:${GIT_SHA}"
echo ""
echo -e "${BLUE}docker-compose.yml updated with tag: ${UPDATE_TAG}${NC}"
echo ""
if [ "$PUSH" = true ]; then
    echo -e "${BLUE}To deploy on your server:${NC}"
    echo -e "  git add docker-compose.yml && git commit -m 'chore: update image tags to ${GIT_SHA}'"
    echo -e "  git push origin ${GIT_BRANCH}"
    echo -e "  # Then on server:"
    echo -e "  git pull && docker compose pull && docker compose up -d --force-recreate"
else
    echo -e "${YELLOW}Images built locally. Run without --no-push to push to registry.${NC}"
fi
=======
echo -e "  Frontend: ${FRONTEND_IMAGE}:${GIT_SHA}"
echo -e "  Backend:  ${BACKEND_IMAGE}:${GIT_SHA}"
echo ""
echo -e "${BLUE}To deploy on your server:${NC}"
echo -e "  # Update docker-compose.yml with tag: ${GIT_SHA}"
echo -e "  docker compose pull"
echo -e "  docker compose up -d --force-recreate"
>>>>>>> 5bee8b3 (feat: add RBAC, Google login, logging, and build script)
echo ""
