# Multi-stage build for optimized production image
# Stage 1: Build dependencies
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Runtime image
FROM node:18-alpine

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create app directory
WORKDIR /app

# Install production dependencies only
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "src/server.js"]