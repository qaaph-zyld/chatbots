class ResponseGenerator {
  constructor(platform, templates) {
    this.platform = platform;
    this.templates = templates;
  }

  async generateResponse(intent, context, customerData) {
    const template = this.templates[intent];
    if (!template) {
      throw new Error(`Template not found for intent: ${intent}`);
    }
    const data = await this.platform.fetchData(context);
    return template.render(data, customerData);
  }
}

module.exports = ResponseGenerator;
