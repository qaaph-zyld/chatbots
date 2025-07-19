const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

class AuthService {
  constructor(secretKey, platformConnector) {
    this.secretKey = secretKey;
    this.platformConnector = platformConnector;
  }

  async verifyCustomer(email, orderNumber) {
    const order = await this.platformConnector.getOrder(orderNumber);
    if (!order) {
      throw new Error('Order not found');
    }
    return order.customer_email === email;
  }

  createSession(customerId, storeId) {
    return jwt.sign(
      { customerId, storeId, exp: Math.floor(Date.now() / 1000) + 3600 },
      this.secretKey
    );
  }

  verifyToken(token) {
    return jwt.verify(token, this.secretKey);
  }
}

module.exports = AuthService;
