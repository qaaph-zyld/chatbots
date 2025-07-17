// Order tracking template implementation
class OrderTrackingTemplate {
  generate(order) {
    return `Your order #${order.number} is ${order.status}.`;
  }
}
