# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
# Install including devDependencies (if built steps required them, typically production only is fine but safely install all here first)
RUN npm install

COPY . .

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup -g 1001 nodejs && adduser -S nodejs -u 1001 -G nodejs

COPY package.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy source code
COPY --chown=nodejs:nodejs src ./src

USER nodejs

EXPOSE 5000

CMD ["npm", "start"]
