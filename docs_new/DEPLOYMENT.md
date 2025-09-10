# Deployment Guide

## Prerequisites
- Node.js 16+ and npm 8+
- MongoDB database
- Redis cache (optional but recommended)
- Environment variables configured

## Environment Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd chatbots
npm install
```

### 2. Environment Variables
Create `.env` file:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mongodb://localhost:27017/chatbots
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

### 3. Database Setup
```bash
# Start MongoDB
mongod --dbpath /data/db

# Run migrations (if any)
npm run migrate
```

## Deployment Options

### Local Development
```bash
npm run dev
```

### Production Deployment
```bash
# Build application
npm run build

# Start production server
npm start
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mongodb://mongo:27017/chatbots
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
  
  mongo:
    image: mongo:5
    volumes:
      - mongo_data:/data/db
  
  redis:
    image: redis:7-alpine

volumes:
  mongo_data:
```

## Health Checks
The application provides health check endpoints:
- `GET /api/health` - API health status
- `GET /` - Application status

## Monitoring
- Application logs are written to `logs/` directory
- Use log aggregation tools like ELK stack
- Monitor key metrics: response time, error rate, throughput

## Security Checklist
- [ ] Environment variables are secure
- [ ] JWT secrets are strong and unique
- [ ] Database connections use authentication
- [ ] HTTPS is enabled in production
- [ ] Rate limiting is configured
- [ ] Security headers are enabled

## Scaling
- Use PM2 for process management
- Configure load balancer for multiple instances
- Use Redis for session storage in multi-instance setup
- Monitor resource usage and scale accordingly

## Backup Strategy
- Regular database backups
- Configuration backup
- Log retention policy
- Disaster recovery plan

## Troubleshooting
Common issues and solutions:
- Port conflicts: Change PORT environment variable
- Database connection: Verify DATABASE_URL
- Memory issues: Increase Node.js heap size
- Performance: Enable Redis caching
