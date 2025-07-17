import { group, sleep } from 'k6';
import authTest from './auth-load-test.js';
import chatTest from './chatbot-load-test.js';

export const options = {
  scenarios: {
    auth: {
      executor: 'ramping-vus',
      exec: 'auth',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
    },
    chat: {
      executor: 'constant-vus',
      exec: 'chat',
      vus: 30,
      duration: '2m',
    },
  },
};

export function auth() {
  authTest();
  sleep(1);
}

export function chat() {
  chatTest();
  sleep(2);
}
