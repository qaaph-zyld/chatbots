// Product inquiry template implementation
class ProductInquiryTemplate {
  generate(product) {
    return `${product.name} is ${product.stock_status}.`;
  }
}
