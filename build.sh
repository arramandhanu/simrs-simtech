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

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${APP_DIR}"

# =========================
# Configuration
# =========================
DOCKER_REPO="aryaramandhanu/simrs-simtech"
FRONTEND_IMAGE="${DOCKER_REPO}-fe"
BACKEND_IMAGE="${DOCKER_REPO}-be"

# Cloud builder group reference
BUILDX_CLOUD_GROUP="${BUILDX_CLOUD_GROUP:-aryaramandhanu/barong}"
BUILDER_NAME="${BUILDER_NAME:-cloud-aryaramandhanu-barong}"

PLATFORMS="${PLATFORMS:-linux/amd64}"

# Optional registry cache
FRONTEND_CACHE_REF="${FRONTEND_IMAGE}:buildcache"
BACKEND_CACHE_REF="${BACKEND_IMAGE}:buildcache"

# Git info
GIT_SHA="$(git rev-parse --short=7 HEAD)"
GIT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

# Production API URL
VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://simrs.ramandhanu.cloud/api}"

# DockerHub credentials
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:-aryaramandhanu}"
DOCKERHUB_TOKEN="${DOCKERHUB_TOKEN:-}"

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

for arg in "$@"; do
    case $arg in
        --no-push) PUSH=false ;;
        --latest) TAG_LATEST=true ;;
        --fe-only) BUILD_BACKEND=false ;;
        --be-only) BUILD_FRONTEND=false ;;
    esac
done

# =========================
# Header
# =========================
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  SIMRS SIMTECH - Docker Build Cloud${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "${YELLOW}Git SHA:${NC}    ${GIT_SHA}"
echo -e "${YELLOW}Branch:${NC}     ${GIT_BRANCH}"
echo -e "${YELLOW}API URL:${NC}    ${VITE_API_BASE_URL}"
echo -e "${YELLOW}Platforms:${NC}  ${PLATFORMS}"
echo -e "${YELLOW}Builder:${NC}    ${BUILDER_NAME}"
echo ""

# =========================
# Docker login (required for push & cloud build)
# =========================
if [[ -z "${DOCKERHUB_TOKEN:-}" ]]; then
    echo -e "${YELLOW}[WARN] DOCKERHUB_TOKEN not set. Attempting without login...${NC}"
else
    echo -e "${GREEN}[INFO] DockerHub login for ${DOCKERHUB_USERNAME}${NC}"
    echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
fi

# =========================
# Ensure cloud builder exists
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
        --cache-from "type=registry,ref=${FRONTEND_CACHE_REF}"
        --cache-to "type=registry,ref=${FRONTEND_CACHE_REF},mode=max"
        -t "${FRONTEND_IMAGE}:${GIT_SHA}"
        -f Dockerfile
    )
    
    if [ "$TAG_LATEST" = true ]; then
        BUILD_ARGS+=(-t "${FRONTEND_IMAGE}:latest")
    fi
    
    if [ "$PUSH" = true ]; then
        BUILD_ARGS+=(--push)
    else
        BUILD_ARGS+=(--load)
    fi
    
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
        --cache-from "type=registry,ref=${BACKEND_CACHE_REF}"
        --cache-to "type=registry,ref=${BACKEND_CACHE_REF},mode=max"
        -t "${BACKEND_IMAGE}:${GIT_SHA}"
        -f Dockerfile
    )
    
    if [ "$TAG_LATEST" = true ]; then
        BUILD_ARGS+=(-t "${BACKEND_IMAGE}:latest")
    fi
    
    if [ "$PUSH" = true ]; then
        BUILD_ARGS+=(--push)
    else
        BUILD_ARGS+=(--load)
    fi
    
    docker buildx build "${BUILD_ARGS[@]}" backend/
    
    echo -e "${GREEN}  ✓ Backend built: ${BACKEND_IMAGE}:${GIT_SHA}${NC}"
fi

# =========================
# Update docker-compose.yml with new tags
# =========================
echo ""
echo -e "${GREEN}Updating docker-compose.yml with new tags...${NC}"

UPDATE_TAG="${GIT_SHA}"
if [ "$TAG_LATEST" = true ]; then
    UPDATE_TAG="latest"
fi

# Update image tags in compose files
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
    echo -e "${YELLOW}Images built locally (--no-push). Run without --no-push to push to registry.${NC}"
fi
echo ""
