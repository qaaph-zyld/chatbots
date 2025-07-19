# ShopBot Deployment Guide

## Overview

This guide covers deploying ShopBot to production environments, including server setup, environment configuration, and monitoring.

## Prerequisites

- Node.js 18+ 
- MongoDB Atlas account or MongoDB server
- SSL certificate for HTTPS
- Domain name configured
- Email service (SendGrid, AWS SES, etc.)

## Environment Setup

### 1. Server Requirements

**Minimum Specifications:**
- 2 CPU cores
- 4GB RAM
- 20GB storage
- Ubuntu 20.04+ or similar Linux distribution

**Recommended Specifications:**
- 4 CPU cores
- 8GB RAM
- 50GB SSD storage
- Load balancer for high availability

### 2. Environment Variables

Create a `.env` file with production values:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shopbot-prod?retryWrites=true&w=majority

# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# API Keys
SHOPIFY_APP_SECRET=your-shopify-app-secret
WOOCOMMERCE_WEBHOOK_SECRET=your-woocommerce-webhook-secret

# External Services
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# SSL/TLS
SSL_CERT_PATH=/path/to/ssl/cert.pem
SSL_KEY_PATH=/path/to/ssl/private.key
```

### 3. Database Setup

#### MongoDB Atlas (Recommended)
1. Create MongoDB Atlas cluster
2. Configure network access (whitelist server IPs)
3. Create database user with read/write permissions
4. Get connection string and update `MONGODB_URI`

#### Self-hosted MongoDB
```bash
# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongo
use shopbot-prod
db.createUser({
  user: "shopbot",
  pwd: "secure-password",
  roles: [{ role: "readWrite", db: "shopbot-prod" }]
})
```

## Deployment Methods

### Method 1: Docker Deployment (Recommended)

#### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S shopbot -u 1001

# Change ownership
RUN chown -R shopbot:nodejs /app
USER shopbot

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### 2. Create docker-compose.yml
```yaml
version: '3.8'

services:
  shopbot:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    depends_on:
      - redis
    networks:
      - shopbot-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - shopbot-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - shopbot
    restart: unless-stopped
    networks:
      - shopbot-network

volumes:
  redis-data:

networks:
  shopbot-network:
    driver: bridge
```

#### 3. Deploy with Docker
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f shopbot

# Scale application
docker-compose up -d --scale shopbot=3
```

### Method 2: PM2 Deployment

#### 1. Install PM2
```bash
npm install -g pm2
```

#### 2. Create ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'shopbot',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

#### 3. Deploy with PM2
```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

# Monitor application
pm2 monit
```

### Method 3: Kubernetes Deployment

#### 1. Create Kubernetes manifests

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shopbot
  labels:
    app: shopbot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: shopbot
  template:
    metadata:
      labels:
        app: shopbot
    spec:
      containers:
      - name: shopbot
        image: shopbot:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: shopbot-secrets
              key: mongodb-uri
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**service.yaml:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: shopbot-service
spec:
  selector:
    app: shopbot
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

#### 2. Deploy to Kubernetes
```bash
# Apply manifests
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Check deployment status
kubectl get deployments
kubectl get pods
kubectl get services
```

## SSL/HTTPS Configuration

### Using Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /static/ {
        alias /app/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Database Migration

### Run Migrations
```bash
# Production migration
NODE_ENV=production npm run migrate

# Verify migration status
NODE_ENV=production node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('Database connected successfully');
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    console.log('Collections:', collections.map(c => c.name));
    process.exit(0);
  });
});
"
```

### Backup Strategy
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/shopbot"
mkdir -p $BACKUP_DIR

# MongoDB backup
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb_$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/shopbot_backup_$DATE.tar.gz" -C "$BACKUP_DIR" "mongodb_$DATE"
rm -rf "$BACKUP_DIR/mongodb_$DATE"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: shopbot_backup_$DATE.tar.gz"
EOF

chmod +x backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

## Monitoring and Logging

### Application Monitoring
```javascript
// Add to server.js
const Sentry = require('@sentry/node');

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});

// Ready check endpoint
app.get('/ready', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

### Log Management
```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

## Security Checklist

### Pre-deployment Security
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] API keys configured with minimal permissions
- [ ] HTTPS/SSL certificates installed
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] CORS properly configured
- [ ] Dependencies updated and scanned
- [ ] Secrets management implemented

### Post-deployment Security
- [ ] Security monitoring enabled
- [ ] Log analysis configured
- [ ] Intrusion detection setup
- [ ] Regular security scans scheduled
- [ ] Backup and recovery tested
- [ ] Incident response plan documented
- [ ] Access controls reviewed
- [ ] Audit logging enabled

## Performance Optimization

### Application Level
```javascript
// Enable compression
const compression = require('compression');
app.use(compression());

// Connection pooling
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

// Caching
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Response caching middleware
const cache = (duration) => {
  return async (req, res, next) => {
    const key = req.originalUrl;
    const cached = await client.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      client.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};
```

### Database Optimization
```javascript
// Index optimization
db.conversations.createIndex({ "store_id": 1, "status": 1 });
db.messages.createIndex({ "conversation_id": 1, "createdAt": -1 });
db.orders.createIndex({ "store_id": 1, "customer_email": 1 });

// Query optimization
const conversations = await Conversation.find({ store_id })
  .select('status customer_id createdAt')
  .limit(50)
  .sort({ createdAt: -1 })
  .lean(); // Use lean() for read-only queries
```

## Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Monitor memory
pm2 monit

# Restart if memory limit exceeded
pm2 restart shopbot
```

#### Database Connection Issues
```bash
# Check MongoDB connection
mongo $MONGODB_URI --eval "db.runCommand('ping')"

# Check network connectivity
telnet cluster0.mongodb.net 27017
```

#### SSL Certificate Issues
```bash
# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout | grep "Not After"

# Renew certificate
sudo certbot renew --dry-run
```

## Rollback Procedures

### Application Rollback
```bash
# Docker rollback
docker-compose down
docker-compose up -d --scale shopbot=0
docker tag shopbot:previous shopbot:latest
docker-compose up -d

# PM2 rollback
pm2 stop shopbot
git checkout previous-stable-tag
npm install
pm2 start ecosystem.config.js --env production
```

### Database Rollback
```bash
# Restore from backup
mongorestore --uri="$MONGODB_URI" --drop /path/to/backup/
```

## Maintenance

### Regular Tasks
- [ ] Monitor application performance
- [ ] Review error logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate API keys quarterly
- [ ] Test backup restoration quarterly
- [ ] Security audit annually
- [ ] Performance optimization review annually

### Scaling Considerations
- Horizontal scaling with load balancers
- Database sharding for large datasets
- CDN for static assets
- Microservices architecture for complex features
- Auto-scaling based on metrics

For additional support, contact the development team or refer to the troubleshooting documentation.
