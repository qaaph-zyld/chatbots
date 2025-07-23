// Order handler implementation
class OrderHandler {
  constructor(orderService, trackingTemplate) {
    this.orderService = orderService;
    this.trackingTemplate = trackingTemplate;
  }

  async handleOrderInquiry(orderNumber) {
    const order = await this.orderService.getOrder(orderNumber);
    return this.trackingTemplate.generate(order);
  }
}
