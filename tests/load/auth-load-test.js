import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const loginRes = http.post(
    'http://localhost:3000/api/auth/login',
    JSON.stringify({
      username: `user_${__VU}@example.com`,
      password: 'test_password',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'response has token': (r) => r.json().accessToken !== undefined,
  });

  sleep(1);
}
