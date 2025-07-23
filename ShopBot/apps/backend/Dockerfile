# Multi-stage build for Node.js backend
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build backend
RUN npm run build:backend

# Production image, copy all the files and run backend
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 shopbot

# Copy built application
COPY --from=builder --chown=shopbot:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=shopbot:nodejs /app/apps/backend/package*.json ./apps/backend/
COPY --from=deps --chown=shopbot:nodejs /app/node_modules ./node_modules

USER shopbot

EXPOSE 3001

ENV PORT 3001

CMD ["node", "apps/backend/dist/server.js"]
