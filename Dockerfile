# Multi-stage Dockerfile for NestJS application with Yarn

# Stage 1: Development
FROM node:22-alpine AS development

WORKDIR /usr/src/app

# Copy package files
COPY package.json yarn.lock* ./
COPY tsconfig*.json ./

# Install all dependencies (including devDependencies)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Stage 2: Production dependencies
FROM node:22-alpine AS production-deps

WORKDIR /usr/src/app

# Copy package files
COPY package.json yarn.lock* ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production

# Stage 3: Production
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /usr/src/app

# Copy production dependencies
COPY --from=production-deps --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules

# Copy built application
COPY --from=development --chown=nestjs:nodejs /usr/src/app/dist ./dist
COPY --from=development --chown=nestjs:nodejs /usr/src/app/package.json ./
COPY --from=development --chown=nestjs:nodejs /usr/src/app/yarn.lock ./

# Copy other necessary files (if they exist)
COPY --chown=nestjs:nodejs .env.example* ./

# Switch to non-root user
USER nestjs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main"]