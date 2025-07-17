import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '30s', target: 0 },
  ],
};

const getAuthToken = () => {
  const loginRes = http.post(
    'http://localhost:3000/api/auth/login',
    JSON.stringify({
      username: `user_${__VU}@example.com`,
      password: 'test_password',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  return loginRes.json().accessToken;
};

export default function () {
  const token = getAuthToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const payload = JSON.stringify({
    message: `Test message ${randomIntBetween(1, 1000)}`,
  });

  const res = http.post(
    'http://localhost:3000/api/chat',
    payload,
    { headers }
  );

  check(res, {
    'status 200': (r) => r.status === 200,
    'response time <500ms': (r) => r.timings.duration < 500,
  });

  sleep(randomIntBetween(1, 3));
}
