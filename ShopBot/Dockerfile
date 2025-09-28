# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY apps/backend/package*.json ./
COPY apps/frontend/package*.json ./frontend/

# Install all dependencies (including dev)
RUN npm ci && npm cache clean --force
RUN cd frontend && npm ci && npm cache clean --force

# Copy source code
COPY apps/backend/ ./
COPY apps/frontend/ ./frontend/

# Build frontend
RUN cd frontend && npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY apps/backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy backend application code
COPY apps/backend/ ./

# Copy built frontend from builder stage
COPY --from=builder /app/frontend/dist ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S shopbot -u 1001 && \
    chown -R shopbot:nodejs /app

# Create logs directory
RUN mkdir -p /app/logs && chown -R shopbot:nodejs /app/logs

# Switch to non-root user
USER shopbot

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "index.js"]
