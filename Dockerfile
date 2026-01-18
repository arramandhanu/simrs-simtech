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

# Stage 2: Serve with Node.js
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 nodejs && adduser -S nodejs -u 1001 -G nodejs

# Copy package files and install only vite for preview
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm install vite

# Copy built assets from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/vite.config.ts ./

USER nodejs

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
