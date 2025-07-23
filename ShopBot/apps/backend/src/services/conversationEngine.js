const { StateMachine } = require('javascript-state-machine');

class ConversationEngine {
  constructor(intentClassifier, responseGenerator) {
    this.intentClassifier = intentClassifier;
    this.responseGenerator = responseGenerator;
    this.fsm = new StateMachine({
      init: 'initial',
      transitions: [
        { name: 'welcome', from: 'initial', to: 'awaiting_input' },
        { name: 'handle_input', from: 'awaiting_input', to: 'processing' },
        { name: 'respond', from: 'processing', to: 'awaiting_input' },
        { name: 'end', from: 'awaiting_input', to: 'ended' }
      ],
      methods: {
        onWelcome: () => {},
        onHandleInput: () => {},
        onRespond: () => {},
        onEnd: () => {}
      }
    });
  }

  start() {
    this.fsm.welcome();
  }

  processMessage(message) {
    this.fsm.handle_input();
    const intent = this.intentClassifier.classify(message);
    const response = this.responseGenerator.generate(intent);
    this.fsm.respond();
    return response;
  }

  end() {
    this.fsm.end();
  }
}

module.exports = ConversationEngine;
