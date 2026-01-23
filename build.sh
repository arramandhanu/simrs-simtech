#!/usr/bin/env bash
# ==============================================
# SIMRS Build & Push Script
# ==============================================
# Uses standard Docker build and tags with git commit SHA
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
DOCKER_REPO="aryaramandhanu/simrs-simtech"
FRONTEND_IMAGE="${DOCKER_REPO}-fe"
BACKEND_IMAGE="${DOCKER_REPO}-be"

# Git info
GIT_SHA="$(git rev-parse --short=7 HEAD)"
GIT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

# Production API URL
VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://simrs.ramandhanu.cloud/api}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# =========================
# Parse arguments
# =========================
PUSH=true
TAG_LATEST=false
BUILD_FRONTEND=true
BUILD_BACKEND=true
NO_CACHE=false

for arg in "$@"; do
    case $arg in
        --no-push) PUSH=false ;;
        --latest) TAG_LATEST=true ;;
        --fe-only) BUILD_BACKEND=false ;;
        --be-only) BUILD_FRONTEND=false ;;
        --no-cache) NO_CACHE=true ;;
    esac
done

# =========================
# Header
# =========================
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  SIMRS SIMTECH - Docker Build${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "${YELLOW}Git SHA:${NC}    ${GIT_SHA}"
echo -e "${YELLOW}Branch:${NC}     ${GIT_BRANCH}"
echo -e "${YELLOW}API URL:${NC}    ${VITE_API_BASE_URL}"
echo ""

# =========================
# Build Frontend
# =========================
if [ "$BUILD_FRONTEND" = true ]; then
    echo -e "${GREEN}[1/2] Building Frontend...${NC}"
    
    BUILD_CMD="docker build"
    
    if [ "$NO_CACHE" = true ]; then
        BUILD_CMD="$BUILD_CMD --no-cache"
    fi
    
    $BUILD_CMD \
        --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
        -t "${FRONTEND_IMAGE}:${GIT_SHA}" \
        -f Dockerfile \
        .
    
    if [ "$TAG_LATEST" = true ]; then
        docker tag "${FRONTEND_IMAGE}:${GIT_SHA}" "${FRONTEND_IMAGE}:latest"
        echo -e "${GREEN}  Tagged as ${FRONTEND_IMAGE}:latest${NC}"
    fi
    
    echo -e "${GREEN}  ✓ Frontend built: ${FRONTEND_IMAGE}:${GIT_SHA}${NC}"
fi

# =========================
# Build Backend
# =========================
if [ "$BUILD_BACKEND" = true ]; then
    echo ""
    echo -e "${GREEN}[2/2] Building Backend...${NC}"
    
    BUILD_CMD="docker build"
    
    if [ "$NO_CACHE" = true ]; then
        BUILD_CMD="$BUILD_CMD --no-cache"
    fi
    
    $BUILD_CMD \
        -t "${BACKEND_IMAGE}:${GIT_SHA}" \
        -f Dockerfile \
        backend/
    
    if [ "$TAG_LATEST" = true ]; then
        docker tag "${BACKEND_IMAGE}:${GIT_SHA}" "${BACKEND_IMAGE}:latest"
        echo -e "${GREEN}  Tagged as ${BACKEND_IMAGE}:latest${NC}"
    fi
    
    echo -e "${GREEN}  ✓ Backend built: ${BACKEND_IMAGE}:${GIT_SHA}${NC}"
fi

# =========================
# Push images
# =========================
if [ "$PUSH" = true ]; then
    echo ""
    if [ "$BUILD_FRONTEND" = true ]; then
        echo -e "${GREEN}Pushing Frontend...${NC}"
        docker push "${FRONTEND_IMAGE}:${GIT_SHA}"
        if [ "$TAG_LATEST" = true ]; then
            docker push "${FRONTEND_IMAGE}:latest"
        fi
    fi
    
    if [ "$BUILD_BACKEND" = true ]; then
        echo -e "${GREEN}Pushing Backend...${NC}"
        docker push "${BACKEND_IMAGE}:${GIT_SHA}"
        if [ "$TAG_LATEST" = true ]; then
            docker push "${BACKEND_IMAGE}:latest"
        fi
    fi
else
    echo ""
    echo -e "${YELLOW}Skipping push (--no-push)${NC}"
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
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Build Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${BLUE}Images built:${NC}"
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
echo ""
