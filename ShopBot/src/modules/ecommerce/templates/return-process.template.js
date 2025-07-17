// Return process template implementation
class ReturnProcessTemplate {
  generate(policy) {
    return `You can return items within ${policy.days} days.`;
  }
}
