// Base class for all e-commerce platform connectors
class PlatformConnector {
  constructor(credentials) {
    this.credentials = credentials;
  }

  async getOrder(orderNumber) { 
    throw new Error('Not implemented'); 
  }

  async getCustomer(email) { 
    throw new Error('Not implemented'); 
  }

  async getProducts(query) { 
    throw new Error('Not implemented'); 
  }

  async processReturn(data) { 
    throw new Error('Not implemented'); 
  }
}
