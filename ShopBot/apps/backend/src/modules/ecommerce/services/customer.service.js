// Customer service implementation
class CustomerService {
  constructor(platformConnector) {
    this.platform = platformConnector;
  }

  async getCustomer(email) {
    return this.platform.getCustomer(email);
  }

  // Other methods
}
