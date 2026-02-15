# m00-os-7 Dockerfile
# Multi-stage build for optimized production image
# Optimized for Digital Ocean App Platform deployment

# ============================================
# Stage 1: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for native modules (better-sqlite3, sharp)
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ============================================
# Stage 2: Runner (Production)
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies for native modules
RUN apk add --no-cache libc6-compat

# Set environment to production
ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxtjs

# Copy built application from builder stage
# The .output directory contains everything needed to run the app
COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output

# Copy package.json for reference (not required for runtime)
COPY --from=builder /app/package.json ./package.json

# Create data directory for persistence with correct ownership
RUN mkdir -p /app/data && chown -R nuxtjs:nodejs /app/data

# Switch to non-root user
USER nuxtjs

# Expose port (Digital Ocean App Platform uses HTTP_PORT env var)
EXPOSE 3000

# Health check for container orchestration
# Note: Digital Ocean App Platform uses its own health checks defined in app.yaml
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", ".output/server/index.mjs"]
