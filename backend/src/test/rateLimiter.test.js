/**
 * Phase 6F — Rate Limiting & Abuse Protection Test Suite
 *
 * Verifies:
 * 1. Health check endpoint remains accessible without rate limiting.
 * 2. Requests below rate limits pass normally (200 / 401 / 400).
 * 3. Auth endpoints return 429 Too Many Requests when rate limit is exceeded.
 * 4. 429 Error response adheres to standard JSON format { success: false, message: ... }.
 * 5. Rate limiting functions independently of client identity payloads.
 */

import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../app.js';

let server;
let BASE_URL;

async function startServer() {
  return new Promise(resolve => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      BASE_URL = `http://localhost:${port}`;
      console.log(`[Rate Limiter Test] Server listening on ${BASE_URL}`);
      resolve();
    });
  });
}

function stopServer() {
  if (server) server.close();
}

async function makeRequest(method, path, headers = {}, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();
  return { status: response.status, data, headers: response.headers };
}

let passedCount = 0;
let failedCount = 0;

async function test(description, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     ${err.message}`);
    failedCount++;
  }
}

async function runRateLimiterTests() {
  await startServer();

  console.log('==================================================');
  console.log('PHASE 6F — RATE LIMITING & ABUSE PROTECTION TEST');
  console.log('==================================================\n');

  try {
    // 1. Health Endpoint Accessibility
    await test('Health check endpoint /api/health is accessible (200 OK)', async () => {
      const res = await makeRequest('GET', '/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
    });

    // 2. Normal Requests below limit
    await test('Normal login attempt receives expected authentication response (400/401)', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {}, {
        email: 'nonexistent@example.com',
        password: 'Password123!'
      });
      assert.ok(res.status === 400 || res.status === 401);
    });

    // 3. Exceed Rate Limit on Auth Endpoint
    await test('Auth endpoint returns 429 Too Many Requests after exceeding max limit', async () => {
      let lastStatus = 0;
      let lastData = null;

      // Send 12 rapid login requests with rate-limiting forced ON for testing
      for (let i = 0; i < 12; i++) {
        const res = await makeRequest('POST', '/api/auth/login', {
          'x-test-rate-limit': 'true'
        }, {
          email: `brute_${i}@example.com`,
          password: 'Password123!'
        });
        lastStatus = res.status;
        lastData = res.data;
        if (res.status === 429) break;
      }

      assert.equal(lastStatus, 429);
      assert.equal(lastData.success, false);
      assert.ok(lastData.message.includes('Too many') || lastData.message.includes('attempts'));
    });

    // 4. Rate Limiting Response Format
    await test('429 response structure matches backend convention { success: false, message: ... }', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        'x-test-rate-limit': 'true'
      }, {
        email: 'brute_exceed@example.com',
        password: 'Password123!'
      });
      assert.equal(res.status, 429);
      assert.equal(typeof res.data.success, 'boolean');
      assert.equal(res.data.success, false);
      assert.equal(typeof res.data.message, 'string');
    });

    // 5. Health Check remains unblocked even after rate limit triggers
    await test('Health check endpoint remains unblocked after rate limit triggers (200 OK)', async () => {
      const res = await makeRequest('GET', '/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
    });

  } finally {
    stopServer();
  }

  console.log('\n==================================================');
  console.log(`SUMMARY: ${passedCount} Passed, ${failedCount} Failed out of 5 Rate Limiter Tests`);
  console.log('==================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runRateLimiterTests();
