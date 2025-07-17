# AI Agent Development Prompt - ShopBot MVP

## MISSION STATEMENT
Transform the existing chatbot framework repository into "ShopBot" - a specialized e-commerce customer support chatbot following the 30-day monetization roadmap.

## REPOSITORY CONTEXT
- **Source Repository**: https://github.com/qaaph-zyld/chatbots
- **Current State**: Generic chatbot framework with basic abstractions
- **Target Branch**: `shopbot-mvp`
- **Timeline**: 30-day sprint to revenue generation

## TECHNICAL FOUNDATION
The existing repository contains:
- Node.js/Express.js backend
- Basic chatbot engine abstractions
- API routing structure
- Middleware framework (auth, caching, rate limiting)
- Testing infrastructure
- Documentation framework

## TRANSFORMATION OBJECTIVES

### PRIMARY GOAL
Convert generic chatbot platform into specialized e-commerce customer support automation system targeting Shopify/WooCommerce stores.

### REVENUE TARGET
- Launch: Day 30
- First customer: Day 30
- Revenue goal: $500-2,000 Month 1

## TECHNICAL SPECIFICATIONS

### Core Architecture Changes
```
Generic Framework → ShopBot Specialization
├── src/modules/chatbot/ → src/modules/ecommerce/
├── Generic templates → E-commerce conversation flows
├── Basic API → Platform-specific integrations
└── General analytics → Customer support metrics
```

### New Module Structure
```
src/modules/ecommerce/
├── integrations/
│   ├── shopify.integration.js
│   ├── woocommerce.integration.js
│   └── platform.factory.js
├── services/
│   ├── order.service.js
│   ├── customer.service.js
│   └── analytics.service.js
├── templates/
│   ├── order-tracking.template.js
│   ├── return-process.template.js
│   └── product-inquiry.template.js
└── handlers/
    ├── order.handler.js
    ├── return.handler.js
    └── product.handler.js
```

## DEVELOPMENT ROADMAP

### Week 1: Foundation (Days 1-7)
**Priority 1: Database Schema**
```sql
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    platform VARCHAR(50),
    api_credentials JSONB,
    settings JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    session_id VARCHAR(255),
    customer_email VARCHAR(255),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    content TEXT,
    sender_type VARCHAR(20),
    intent VARCHAR(100),
    confidence DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Priority 2: Platform Integration Framework**
```javascript
// Base class for all e-commerce platforms
class PlatformConnector {
    constructor(credentials) {
        this.credentials = credentials;
    }
    
    async getOrder(orderNumber) { throw new Error('Not implemented'); }
    async getCustomer(email) { throw new Error('Not implemented'); }
    async getProducts(query) { throw new Error('Not implemented'); }
    async processReturn(data) { throw new Error('Not implemented'); }
}
```

**Priority 3: Intent Classification Engine**
```javascript
const ecommerceIntents = {
    ORDER_STATUS: {
        patterns: [/order.*status/i, /where.*order/i, /tracking/i],
        confidence: 0.8,
        requiresAuth: true
    },
    RETURN_REQUEST: {
        patterns: [/return/i, /refund/i, /exchange/i],
        confidence: 0.9,
        requiresAuth: true
    },
    PRODUCT_INQUIRY: {
        patterns: [/product/i, /item/i, /availability/i],
        confidence: 0.7,
        requiresAuth: false
    }
};
```

### Week 2: Core Features (Days 8-14)
**Priority 1: Shopify Integration**
```javascript
class ShopifyConnector extends PlatformConnector {
    constructor(credentials) {
        super(credentials);
        this.baseUrl = `https://${credentials.shop}.myshopify.com/admin/api/2023-10`;
    }
    
    async getOrder(orderNumber) {
        const response = await axios.get(`${this.baseUrl}/orders.json`, {
            params: { name: orderNumber },
            headers: { 'X-Shopify-Access-Token': this.credentials.token }
        });
        return response.data.orders[0];
    }
}
```

**Priority 2: Order Processing Logic**
```javascript
class OrderHandler {
    async processInquiry(message, customerEmail) {
        const orderNumber = this.extractOrderNumber(message);
        const order = await this.platform.getOrder(orderNumber);
        
        if (!this.validateCustomer(order, customerEmail)) {
            return this.generateAuthError();
        }
        
        return this.generateOrderStatus(order);
    }
}
```

**Priority 3: Authentication System**
```javascript
class CustomerAuth {
    async verifyCustomer(email, orderNumber) {
        const order = await this.platform.getOrder(orderNumber);
        return order && order.customer_email === email;
    }
    
    createSession(customerId, storeId) {
        return jwt.sign(
            { customerId, storeId, exp: Date.now() + 3600000 },
            process.env.JWT_SECRET
        );
    }
}
```

### Week 3: Integration & Testing (Days 15-21)
**Priority 1: WooCommerce Integration**
```javascript
class WooCommerceConnector extends PlatformConnector {
    constructor(credentials) {
        super(credentials);
        this.api = new WooCommerceAPI({
            url: credentials.siteUrl,
            consumerKey: credentials.consumerKey,
            consumerSecret: credentials.consumerSecret
        });
    }
}
```

**Priority 2: Admin Dashboard**
- Store configuration interface
- Real-time conversation monitoring
- Analytics dashboard
- Performance metrics

**Priority 3: Response Templates**
```javascript
const templates = {
    orderStatus: (order) => `Your order #${order.number} is ${order.status}. ${order.tracking_url ? `Track it here: ${order.tracking_url}` : ''}`,
    returnProcess: (policy) => `You can return items within ${policy.days} days. Start your return here: ${policy.url}`,
    productInfo: (product) => `${product.name} is ${product.stock_status}. Price: ${product.price}`
};
```

### Week 4: Launch Preparation (Days 22-30)
**Priority 1: Deployment Setup**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

**Priority 2: Monitoring & Analytics**
```javascript
const metrics = {
    trackConversation: (storeId, intent, resolved) => {
        analytics.track('conversation', {
            storeId,
            intent,
            resolved,
            timestamp: Date.now()
        });
    }
};
```

**Priority 3: Documentation & Launch**
- API documentation
- Setup guides
- Demo videos
- Pricing pages

## KEY TECHNICAL REQUIREMENTS

### Performance Standards
- Response time: <1 second
- Intent accuracy: >90%
- System uptime: >99.9%
- Concurrent users: 1000+

### Security Implementation
- JWT-based authentication
- API key encryption
- Input validation
- Rate limiting
- HTTPS enforcement

### Integration Standards
- RESTful API design
- Webhook support
- Error handling
- Retry mechanisms
- Logging framework

## BUSINESS LOGIC PRIORITIES

### Customer Authentication Flow
1. Customer provides email + order number
2. System validates against platform API
3. Create temporary session
4. Enable order-specific queries
5. Session expires after 1 hour

### Conversation Flow Engine
1. Intent classification (NLP)
2. Authentication check
3. Platform API call
4. Response generation
5. Analytics logging
6. Escalation if needed

### Analytics Framework
- Resolution rate tracking
- Response time monitoring
- Customer satisfaction scoring
- Cost reduction calculation
- Revenue impact analysis

## LAUNCH STRATEGY

### Target Market
- Shopify stores ($1M-10M revenue)
- WooCommerce sites
- 50-500 support tickets/month
- Currently using human agents

### Pricing Model
- Basic: $99/month (1 store)
- Pro: $199/month (3 stores)
- Enterprise: $399/month (unlimited)

### Success Metrics
- Day 30: 5 paying customers
- Month 2: 50 customers
- Month 3: 150 customers
- Month 6: 500 customers

## DEVELOPMENT GUIDELINES

### Code Quality Standards
- ESLint configuration
- Unit test coverage >80%
- Integration tests for APIs
- Error handling for all edge cases
- Comprehensive logging

### Documentation Requirements
- API endpoint documentation
- Setup/installation guides
- Configuration examples
- Troubleshooting guides
- Video tutorials

### Security Checklist
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] API key encryption
- [ ] Rate limiting
- [ ] HTTPS enforcement
- [ ] Data encryption at rest

## EXECUTION PRIORITIES

### Critical Path Items
1. Platform integrations (Shopify/WooCommerce)
2. Order status automation
3. Customer authentication
4. Admin dashboard
5. Deployment pipeline

### Secondary Features
1. Return processing
2. Product inquiries
3. Analytics dashboard
4. Multi-language support
5. Mobile optimization

### Future Enhancements
1. AI-powered recommendations
2. Inventory alerts
3. Automated marketing
4. Advanced analytics
5. Enterprise features

## SUCCESS CRITERIA

### Technical Milestones
- [ ] Database schema implemented
- [ ] Platform integrations working
- [ ] Authentication system active
- [ ] Admin dashboard functional
- [ ] Deployment pipeline ready

### Business Milestones
- [ ] MVP launched (Day 30)
- [ ] First paying customer (Day 30)
- [ ] 5 customers (Month 1)
- [ ] $500 MRR (Month 1)
- [ ] 50 customers (Month 2)

Begin implementation immediately. Focus on core e-commerce functionality over generic features. Prioritize revenue generation over perfect architecture. Launch fast, iterate quickly.