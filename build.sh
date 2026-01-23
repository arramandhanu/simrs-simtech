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
DOCKER_REPO="aryaramandhanu/simrs-simtech"
FRONTEND_IMAGE="${DOCKER_REPO}-fe"
BACKEND_IMAGE="${DOCKER_REPO}-be"

# Get git commit SHA
GIT_SHA=$(git rev-parse --short HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Production API URL
VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://simrs.ramandhanu.cloud/api}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
PUSH=true
TAG_LATEST=false
for arg in "$@"; do
    case $arg in
        --no-push) PUSH=false ;;
        --latest) TAG_LATEST=true ;;
    esac
done

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  SIMRS SIMTECH - Docker Build${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "${YELLOW}Git SHA:${NC}    ${GIT_SHA}"
echo -e "${YELLOW}Branch:${NC}     ${GIT_BRANCH}"
echo -e "${YELLOW}API URL:${NC}    ${VITE_API_BASE_URL}"
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

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Build Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${BLUE}Images built:${NC}"
echo -e "  Frontend: ${FRONTEND_IMAGE}:${GIT_SHA}"
echo -e "  Backend:  ${BACKEND_IMAGE}:${GIT_SHA}"
echo ""
echo -e "${BLUE}To deploy on your server:${NC}"
echo -e "  # Update docker-compose.yml with tag: ${GIT_SHA}"
echo -e "  docker compose pull"
echo -e "  docker compose up -d --force-recreate"
echo ""
