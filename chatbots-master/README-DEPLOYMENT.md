# Chatbots Platform Deployment Guide

This document provides instructions for deploying the Chatbots Platform in different environments.

## Table of Contents

- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Continuous Integration/Continuous Deployment](#continuous-integrationcontinuous-deployment)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Security Considerations](#security-considerations)

## Environment Configuration

The application uses environment-specific configuration files located in the `config/environments` directory:

- `development.js`: Local development environment
- `staging.js`: Testing and staging environment
- `production.js`: Production environment

The configuration is loaded based on the `NODE_ENV` environment variable. If not set, it defaults to `development`.

### Environment Variables

Key environment variables that should be set in production:

```
NODE_ENV=production
MONGODB_URI=mongodb://username:password@host:port/database
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
JWT_SECRET=your-jwt-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret
OPENAI_API_KEY=your-openai-api-key
S3_ACCESS_KEY_ID=your-s3-access-key
S3_SECRET_ACCESS_KEY=your-s3-secret-key
```

## Local Development

To run the application locally:

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. The application will be available at `http://localhost:3000`

## Docker Deployment

The application can be deployed using Docker and Docker Compose.

### Development Environment

```bash
docker-compose up -d
```

### Staging Environment

```bash
docker-compose -f docker-compose.staging.yml up -d
```

### Production Environment

```bash
docker-compose -f docker-compose.production.yml up -d
```

## Continuous Integration/Continuous Deployment

The application uses GitHub Actions for CI/CD. The workflow is defined in `.github/workflows/main.yml`.

The CI/CD pipeline includes:

1. **Testing**: Runs linting and unit tests
2. **Building**: Builds the application
3. **Deployment**: Deploys to staging or production based on the branch

### Deployment Script

A deployment script is available in `scripts/deploy.js` that can be used to deploy the application to different environments:

```bash
node scripts/deploy.js [environment]
```

Where `[environment]` is one of: `development`, `staging`, or `production`.

## Monitoring and Logging

### Health Check Endpoints

- `/api/v1/health`: Basic health check endpoint
- `/api/v1/health/status`: Detailed system status (requires admin authentication)
- `/api/v1/metrics`: Prometheus metrics endpoint (requires admin authentication)

### Prometheus and Grafana

In production, the application is monitored using Prometheus and Grafana:

- Prometheus collects metrics from the application
- Grafana provides visualization of the metrics

## Backup and Recovery

The production environment includes an automated backup service that:

1. Creates regular backups of the MongoDB database
2. Uploads backups to an S3 bucket
3. Retains a configurable number of recent backups

To restore from a backup:

```bash
mongorestore --gzip --archive=backup_file.gz --uri="mongodb://username:password@host:port/database"
```

## Security Considerations

1. **Environment Variables**: Sensitive information should be stored in environment variables, not in code
2. **HTTPS**: All production traffic should use HTTPS
3. **API Keys**: API keys should be rotated regularly
4. **JWT Tokens**: JWT secrets should be strong and kept secure
5. **Rate Limiting**: API endpoints are protected with rate limiting to prevent abuse
6. **Input Validation**: All user input should be validated before processing
7. **CORS**: CORS is configured to restrict access to the API
