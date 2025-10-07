# ShopBot MVP Deployment Guide

## 🚀 Production Deployment

### Prerequisites

1. **Node.js** 18+ installed
2. **MongoDB** 6.0+ running
3. **Stripe Account** with API keys
4. **Domain** with SSL certificate
5. **Server** with at least 2GB RAM

### Environment Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd ShopBot
npm install --production
```

2. **Environment Configuration**
```bash
cp .env.production .env
# Edit .env with your actual values
```

3. **Required Environment Variables**
```bash
# Essential
JWT_SECRET=your_secure_jwt_secret_here
STRIPE_SECRET_KEY=sk_live_your_stripe_key
MONGODB_URI=mongodb://localhost:27017/shopbot_prod

# Optional but recommended
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
SHOPIFY_API_KEY=your_shopify_key
WOOCOMMERCE_CONSUMER_KEY=ck_your_woo_key
```

### Database Setup

1. **MongoDB Installation**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

2. **Create Database**
```bash
mongo
use shopbot_prod
db.createUser({
  user: "shopbot",
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

### SSL/HTTPS Setup

1. **Using Let's Encrypt (Recommended)**
```bash
sudo apt-get install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

2. **Update Nginx Configuration**
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Deployment Options

#### Option 1: Direct Node.js
```bash
# Start production server
node start-production.js
```

#### Option 2: PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start start-production.js --name "shopbot-mvp"
pm2 startup
pm2 save
```

#### Option 3: Docker
```bash
# Build and start
docker-compose up -d --build
```

### Stripe Webhook Setup

1. **Create Webhook Endpoint**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://yourdomain.com/api/billing/webhook`
   - Select events: `customer.subscription.*`, `invoice.*`

2. **Update Environment**
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_stripe
```

### Health Monitoring

1. **Health Check Endpoint**
```bash
curl https://yourdomain.com/health
```

2. **Metrics Endpoint**
```bash
curl https://yourdomain.com/api/metrics
```

### Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled with valid SSL
- [ ] Database authentication enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Webhook signatures verified
- [ ] Regular security updates

### Performance Optimization

1. **Enable Gzip Compression**
```nginx
gzip on;
gzip_types text/plain application/json application/javascript text/css;
```

2. **Set up Caching**
```nginx
location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

3. **Database Indexing**
```javascript
// Create indexes for better performance
db.usage.createIndex({ "customerId": 1, "monthKey": 1 })
db.conversations.createIndex({ "sessionId": 1, "timestamp": -1 })
```

## 🧪 Testing Deployment

### 1. Basic Functionality
```bash
# Test health endpoint
curl https://yourdomain.com/health

# Test chat API
curl -X POST https://yourdomain.com/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "sessionId": "test-123"}'
```

### 2. Billing System
```bash
# Test subscription plans
curl https://yourdomain.com/api/billing/plans

# Test usage tracking (requires customer ID)
curl -X POST https://yourdomain.com/api/billing/usage \
  -H "Content-Type: application/json" \
  -d '{"customerId": "test-customer", "conversationCount": 1}'
```

### 3. Integration Tests
- [ ] Stripe payment processing
- [ ] Webhook handling
- [ ] Usage tracking
- [ ] Rate limiting
- [ ] Error handling

## 📊 Monitoring & Maintenance

### Log Management
```bash
# View application logs
pm2 logs shopbot-mvp

# Rotate logs
pm2 install pm2-logrotate
```

### Database Backup
```bash
# Create backup
mongodump --db shopbot_prod --out /backup/$(date +%Y%m%d)

# Restore backup
mongorestore --db shopbot_prod /backup/20231207/shopbot_prod
```

### Performance Monitoring
- Monitor CPU and memory usage
- Track response times
- Monitor database performance
- Set up alerts for errors

### Regular Maintenance
- [ ] Update dependencies monthly
- [ ] Review and rotate secrets quarterly
- [ ] Clean up old usage data
- [ ] Monitor disk space
- [ ] Review security logs

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

2. **MongoDB Connection Issues**
```bash
# Check MongoDB status
sudo systemctl status mongodb
# Restart MongoDB
sudo systemctl restart mongodb
```

3. **SSL Certificate Issues**
```bash
# Renew Let's Encrypt certificate
sudo certbot renew
# Restart Nginx
sudo systemctl restart nginx
```

4. **High Memory Usage**
```bash
# Monitor memory
free -h
# Restart application
pm2 restart shopbot-mvp
```

### Log Analysis
```bash
# Check error logs
tail -f logs/shopbot.log | grep ERROR

# Monitor access patterns
tail -f /var/log/nginx/access.log
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Load balancer (Nginx/HAProxy)
- Multiple application instances
- Database replication
- Redis for session storage

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching layers
- Use CDN for static assets

### Monitoring Metrics
- Response time < 100ms
- Error rate < 0.1%
- Uptime > 99.9%
- Memory usage < 80%

## 🎯 Go-Live Checklist

- [ ] Production environment configured
- [ ] Database setup and secured
- [ ] SSL certificate installed
- [ ] Stripe integration tested
- [ ] Webhooks configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Security measures in place
- [ ] Performance optimized
- [ ] Documentation updated
- [ ] Team trained on deployment
- [ ] Rollback plan prepared

## 📞 Support

For deployment issues:
1. Check logs first
2. Review this guide
3. Test individual components
4. Contact development team

**Remember**: Always test in staging before production deployment!
