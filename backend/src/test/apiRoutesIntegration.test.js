/**
 * SmartProcure API Routes Integration & Wiring Unit Test Suite (Phase 2F.1)
 */

import assert from 'node:assert/strict';
import app from '../app.js';

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function asyncTest(description, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// Lightweight HTTP test helper using app handle
async function makeRequest(method, path, headers = {}, body = null) {
  const reqListeners = app.listeners('request');
  return new Promise((resolve, reject) => {
    const http = import('node:http');
    http.then(mod => {
      const server = mod.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        const options = {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        };

        const req = mod.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            server.close();
            try {
              const json = data ? JSON.parse(data) : {};
              resolve({ status: res.statusCode, body: json });
            } catch (e) {
              resolve({ status: res.statusCode, text: data });
            }
          });
        });

        req.on('error', (err) => {
          server.close();
          reject(err);
        });

        if (body) {
          req.write(JSON.stringify(body));
        }
        req.end();
      });
    });
  });
}

console.log('==================================================');
console.log('SMARTPROCURE API WIRING & ROUTES TEST SUITE');
console.log('==================================================\n');

async function runApiTests() {
  // 1. Health Check Endpoint
  console.log('[1] Health Check Endpoint:');
  await asyncTest('GET /api/health returns 200 OK', async () => {
    const res = await makeRequest('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.message.includes('Smart Procurement'));
  });

  // 2. Auth Middleware Enforcement
  console.log('\n[2] Auth Middleware Enforcement:');
  await asyncTest('Unauthenticated request to /api/queue/check-in returns 401 Unauthorized', async () => {
    const res = await makeRequest('POST', '/api/queue/check-in', {}, { bookingId: 'invalid' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('Unauthorized'));
  });

  await asyncTest('Unauthenticated request to /api/centres/c111/capacity returns 401 Unauthorized', async () => {
    const res = await makeRequest('GET', '/api/centres/c1111111-1111-1111-1111-111111111111/capacity');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // 3. Parameter Validation for Queue Endpoints
  console.log('\n[3] Parameter & UUID Validation:');
  const authHeader = { Authorization: 'Bearer mock-valid-token' };

  await asyncTest('Invalid UUID in GET /api/queue/invalid-uuid/position returns 400 Bad Request', async () => {
    const res = await makeRequest('GET', '/api/queue/invalid-uuid/position', authHeader);
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('Invalid queue entry ID format'));
  });

  await asyncTest('Invalid UUID in GET /api/centres/not-a-uuid/capacity returns 400 Bad Request', async () => {
    const res = await makeRequest('GET', '/api/centres/not-a-uuid/capacity', authHeader);
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('Invalid centre ID format'));
  });

  await asyncTest('Invalid UUID in GET /api/centres/not-a-uuid/analytics returns 400 Bad Request', async () => {
    const res = await makeRequest('GET', '/api/centres/not-a-uuid/analytics', authHeader);
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  // 4. Express Route Mount Invariant Guard
  console.log('\n[4] Express Route Mount & Integration Invariants:');
  test('app router has queueRoutes mounted under /api/queue', () => {
    const routes = app._router.stack
      .filter(r => r.route || r.name === 'router')
      .map(r => r.regexp.toString());
    assert.ok(routes.some(r => r.includes('queue')));
  });

  test('app router has notificationRoutes mounted under /api/notifications', () => {
    const routes = app._router.stack
      .filter(r => r.route || r.name === 'router')
      .map(r => r.regexp.toString());
    assert.ok(routes.some(r => r.includes('notifications')));
  });

  console.log('\n==================================================');
  console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runApiTests();
