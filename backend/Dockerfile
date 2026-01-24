# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 nodejs && adduser -S nodejs -u 1001 -G nodejs

# Copy package files and install production dependencies
COPY package.json ./
RUN npm install --only=production

# Copy source code
COPY --chown=nodejs:nodejs src ./src

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads/str && chown -R nodejs:nodejs /app/uploads

USER nodejs

EXPOSE 5000

CMD ["npm", "start"]
