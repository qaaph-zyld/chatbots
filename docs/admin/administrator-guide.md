# Administrator Guide

This comprehensive guide provides system administrators with the information needed to install, configure, maintain, and troubleshoot the Chatbot Platform.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [User Management](#user-management)
5. [Monitoring and Alerting](#monitoring-and-alerting)
6. [Backup and Recovery](#backup-and-recovery)
7. [Performance Tuning](#performance-tuning)
8. [Security](#security)
9. [Troubleshooting](#troubleshooting)
10. [Appendix](#appendix)

## System Requirements

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 8 GB | 16+ GB |
| Disk Space | 20 GB | 50+ GB SSD |
| Network | 100 Mbps | 1 Gbps |

### Software Requirements

- **Operating System**: Ubuntu 20.04 LTS or later, CentOS 8+, or Windows Server 2019+
- **Node.js**: Version 16.x or later
- **MongoDB**: Version 5.0 or later
- **Redis**: Version 6.0 or later
- **Docker**: Version 20.10 or later (if using containerized deployment)
- **Kubernetes**: Version 1.21 or later (if using orchestrated deployment)

## Installation

### Docker Installation (Recommended)

1. **Pull the Docker image**:
   ```bash
   docker pull chatbotplatform/server:latest
   ```

2. **Create a docker-compose.yml file**:
   ```yaml
   version: '3'
   services:
     app:
       image: chatbotplatform/server:latest
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - MONGODB_URI=mongodb://mongo:27017/chatbot
         - REDIS_URI=redis://redis:6379
       depends_on:
         - mongo
         - redis
     mongo:
       image: mongo:5.0
       volumes:
         - mongo-data:/data/db
     redis:
       image: redis:6.0
       volumes:
         - redis-data:/data
   volumes:
     mongo-data:
     redis-data:
   ```

3. **Start the services**:
   ```bash
   docker-compose up -d
   ```

### Manual Installation

1. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install MongoDB**:
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

3. **Install Redis**:
   ```bash
   sudo apt-get install redis-server
   sudo systemctl start redis-server
   sudo systemctl enable redis-server
   ```

4. **Clone the repository**:
   ```bash
   git clone https://github.com/your-organization/chatbot-platform.git
   cd chatbot-platform
   ```

5. **Install dependencies**:
   ```bash
   npm install --production
   ```

6. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

7. **Start the application**:
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development, test, production) | development |
| `PORT` | HTTP port | 3000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/chatbot |
| `REDIS_URI` | Redis connection string | redis://localhost:6379 |
| `JWT_SECRET` | Secret for JWT tokens | (random generated) |
| `LOG_LEVEL` | Logging level | info |
| `SMTP_HOST` | SMTP server for emails | - |
| `SMTP_PORT` | SMTP port | 587 |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASS` | SMTP password | - |
| `ADMIN_EMAIL` | Default admin email | admin@example.com |
| `ADMIN_PASSWORD` | Default admin password | (random generated) |

### Configuration Files

The main configuration files are located in the `config` directory:

- `default.js`: Default configuration
- `development.js`: Development environment overrides
- `production.js`: Production environment overrides
- `test.js`: Test environment overrides

## User Management

### User Roles

The platform supports the following user roles:

- **Super Admin**: Full system access
- **Admin**: Organization-level administration
- **Manager**: Can manage chatbots and view analytics
- **Developer**: Can create and modify chatbots
- **Viewer**: Read-only access to chatbots and analytics

### Managing Users

1. **Creating Users**:
   - Navigate to "Administration" > "Users"
   - Click "Add User"
   - Fill in the user details and select appropriate role
   - Click "Create User"

2. **Editing Users**:
   - Navigate to "Administration" > "Users"
   - Find the user and click "Edit"
   - Modify the user details
   - Click "Save Changes"

3. **Deactivating Users**:
   - Navigate to "Administration" > "Users"
   - Find the user and click "Deactivate"
   - Confirm the action

### Role-Based Access Control

You can customize permissions for each role:

1. Navigate to "Administration" > "Roles"
2. Select the role to modify
3. Adjust the permissions
4. Click "Save Changes"

## Monitoring and Alerting

### System Metrics

The platform collects the following metrics:

- **System**: CPU, memory, disk usage
- **Application**: Request rate, response time, error rate
- **Database**: Query performance, connection pool status
- **Cache**: Hit rate, memory usage
- **Chatbot**: Conversation count, response accuracy, user satisfaction

### Monitoring Dashboard

1. **Accessing the Dashboard**:
   - Navigate to "Administration" > "Monitoring"
   - View real-time and historical metrics

2. **Custom Dashboards**:
   - Click "Create Dashboard"
   - Add desired metrics and visualizations
   - Save the dashboard

### Alert Configuration

1. **Creating Alerts**:
   - Navigate to "Administration" > "Alerts"
   - Click "Add Alert"
   - Select the metric and threshold
   - Configure notification channels
   - Click "Save Alert"

2. **Notification Channels**:
   - Email
   - Slack
   - Webhook
   - SMS (requires additional configuration)

## Backup and Recovery

### Database Backup

#### Automated Backups

1. **Configure backup schedule**:
   ```bash
   # Edit the crontab
   crontab -e
   
   # Add a daily backup at 2 AM
   0 2 * * * /path/to/backup-script.sh
   ```

2. **Sample backup script**:
   ```bash
   #!/bin/bash
   TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
   BACKUP_DIR="/path/to/backups"
   
   # MongoDB backup
   mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongo_$TIMESTAMP"
   
   # Compress the backup
   tar -czf "$BACKUP_DIR/mongo_$TIMESTAMP.tar.gz" "$BACKUP_DIR/mongo_$TIMESTAMP"
   
   # Remove the uncompressed directory
   rm -rf "$BACKUP_DIR/mongo_$TIMESTAMP"
   
   # Keep only the last 7 backups
   ls -tp "$BACKUP_DIR" | grep -v '/$' | tail -n +8 | xargs -I {} rm -- "$BACKUP_DIR/{}"
   ```

#### Manual Backups

```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/chatbot" --out="/path/to/backup"

# Redis backup
redis-cli save
cp /var/lib/redis/dump.rdb /path/to/backup/redis_dump.rdb
```

### Recovery Procedure

1. **MongoDB restoration**:
   ```bash
   mongorestore --uri="mongodb://localhost:27017/chatbot" /path/to/backup
   ```

2. **Redis restoration**:
   ```bash
   # Stop Redis
   sudo systemctl stop redis-server
   
   # Replace the dump file
   cp /path/to/backup/redis_dump.rdb /var/lib/redis/dump.rdb
   
   # Set proper ownership
   sudo chown redis:redis /var/lib/redis/dump.rdb
   
   # Start Redis
   sudo systemctl start redis-server
   ```

## Performance Tuning

### Node.js Optimization

1. **Memory allocation**:
   ```bash
   # Increase Node.js memory limit to 4GB
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

2. **Cluster mode** (in `ecosystem.config.js`):
   ```javascript
   module.exports = {
     apps: [{
       name: "chatbot-platform",
       script: "./src/index.js",
       instances: "max",
       exec_mode: "cluster",
       env: {
         NODE_ENV: "production"
       }
     }]
   }
   ```

### MongoDB Optimization

1. **Indexing**:
   - Ensure proper indexes are created for frequently queried fields
   - Run `db.collection.getIndexes()` to view existing indexes
   - Add missing indexes with `db.collection.createIndex({ field: 1 })`

2. **Connection pooling**:
   - Adjust the connection pool size in the MongoDB connection string:
   ```
   mongodb://localhost:27017/chatbot?maxPoolSize=100
   ```

### Redis Optimization

1. **Memory policy**:
   - Edit `/etc/redis/redis.conf`:
   ```
   maxmemory 2gb
   maxmemory-policy allkeys-lru
   ```

2. **Persistence settings**:
   - For better performance with acceptable data loss risk:
   ```
   save 900 1
   save 300 10
   save 60 10000
   ```

## Security

### Authentication

The platform uses JWT (JSON Web Tokens) for authentication. Token expiration is configurable:

```javascript
// In config/production.js
module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '1d' // 1 day expiration
  }
}
```

### API Rate Limiting

Configure rate limiting to prevent abuse:

```javascript
// In config/production.js
module.exports = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  }
}
```

### Data Encryption

1. **Database encryption**:
   - Enable MongoDB encryption at rest
   - Use TLS for MongoDB connections

2. **Environment variable encryption**:
   - Use a vault solution like HashiCorp Vault or AWS Secrets Manager
   - Avoid storing secrets in plain text files

### Security Best Practices

1. **Regular updates**:
   ```bash
   # Update dependencies
   npm audit fix
   
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   ```

2. **Firewall configuration**:
   ```bash
   # Allow only necessary ports
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

## Troubleshooting

### Common Issues

#### Application Won't Start

1. **Check logs**:
   ```bash
   tail -f logs/app.log
   ```

2. **Verify MongoDB connection**:
   ```bash
   mongo mongodb://localhost:27017/chatbot
   ```

3. **Check Redis connection**:
   ```bash
   redis-cli ping
   ```

#### High CPU/Memory Usage

1. **Check Node.js processes**:
   ```bash
   ps aux | grep node
   ```

2. **Monitor system resources**:
   ```bash
   top
   ```

3. **Check MongoDB performance**:
   ```bash
   mongo --eval "db.currentOp()"
   ```

### Log Files

- **Application logs**: `logs/app.log`
- **Error logs**: `logs/error.log`
- **Access logs**: `logs/access.log`
- **MongoDB logs**: `/var/log/mongodb/mongod.log`
- **Redis logs**: `/var/log/redis/redis-server.log`

### Support Resources

- **Documentation**: https://docs.chatbotplatform.com
- **GitHub Issues**: https://github.com/your-organization/chatbot-platform/issues
- **Community Forum**: https://community.chatbotplatform.com
- **Email Support**: support@chatbotplatform.com

## Appendix

### Command Reference

```bash
# Start the application
npm start

# Run in development mode
npm run dev

# Run tests
npm test

# Database migrations
npm run migrate:up
npm run migrate:down

# Generate API documentation
npm run docs
```

### Configuration Templates

Sample configuration files for various deployment scenarios are available in the `examples` directory:

- `examples/small-deployment.js`: For small deployments (1-5 chatbots)
- `examples/medium-deployment.js`: For medium deployments (5-20 chatbots)
- `examples/large-deployment.js`: For large deployments (20+ chatbots)
- `examples/high-availability.js`: For high-availability setups

### Monitoring Integration

Sample configurations for popular monitoring tools:

- Prometheus: `examples/prometheus.yml`
- Grafana: `examples/grafana-dashboard.json`
- ELK Stack: `examples/logstash.conf`

### Backup Scripts

Additional backup scripts for different environments:

- AWS S3: `scripts/backup-to-s3.sh`
- Google Cloud Storage: `scripts/backup-to-gcs.sh`
- Azure Blob Storage: `scripts/backup-to-azure.sh`
