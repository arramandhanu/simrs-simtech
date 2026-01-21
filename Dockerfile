# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build with environment variable for API URL
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# Stage 2: Serve with simple static server
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 nodejs && adduser -S nodejs -u 1001 -G nodejs

# Install serve for static file serving
RUN npm install -g serve

# Copy built assets from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

USER nodejs

EXPOSE 4173

# Serve the static files on port 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
