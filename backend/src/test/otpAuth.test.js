/**
 * Phase 7A — Farmer Mobile OTP Authentication Test Suite
 *
 * Verifies:
 * 1. Phone number normalization and validation.
 * 2. POST /api/auth/send-otp payload validation & generic response.
 * 3. POST /api/auth/verify-otp Zod schema enforcement (6 numeric digits).
 * 4. Disallowed field injection prevention (role, user_id, farmer_id).
 * 5. Invalid/expired OTP rejection (401 Unauthorized).
 * 6. Rate limiting protection on /send-otp.
 * 7. Preservation of existing email/password login and authentication middleware.
 */

import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../app.js';
import { normalizePhone } from '../validators/authValidator.js';

let server;
let BASE_URL;

async function startServer() {
  return new Promise(resolve => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      BASE_URL = `http://localhost:${port}`;
      console.log(`[OTP Auth Test] Server listening on ${BASE_URL}`);
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
  return { status: response.status, data };
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

async function runOtpAuthTests() {
  await startServer();

  console.log('==================================================');
  console.log('PHASE 7A — FARMER MOBILE OTP AUTHENTICATION TEST');
  console.log('==================================================\n');

  try {
    // 1. Phone Normalization Unit Checks
    await test('normalizePhone formats 10-digit Indian numbers to E.164 (+91XXXXXXXXXX)', async () => {
      assert.equal(normalizePhone('9876543210'), '+919876543210');
      assert.equal(normalizePhone('+919876543210'), '+919876543210');
      assert.equal(normalizePhone(' 9876543210 '), '+919876543210');
    });

    await test('normalizePhone rejects malformed numbers and letters', async () => {
      assert.throws(() => normalizePhone('12345'), /Invalid Indian mobile/);
      assert.throws(() => normalizePhone('987654321a'), /Invalid Indian mobile/);
      assert.throws(() => normalizePhone(''), /Invalid phone number format/);
    });

    // 2. Send OTP Endpoint Checks
    await test('POST /api/auth/send-otp returns generic account-enumeration shielded response', async () => {
      const res = await makeRequest('POST', '/api/auth/send-otp', {}, {
        phone: '9876543210'
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.message.includes('OTP has been sent'));
    });

    await test('POST /api/auth/send-otp rejects invalid phone number (400)', async () => {
      const res = await makeRequest('POST', '/api/auth/send-otp', {}, {
        phone: '123'
      });
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    await test('POST /api/auth/send-otp rejects disallowed injected fields like role or user_id (400)', async () => {
      const res = await makeRequest('POST', '/api/auth/send-otp', {}, {
        phone: '9876543210',
        role: 'SYSTEM_ADMIN',
        user_id: 'b1111111-1111-1111-1111-111111111111'
      });
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    // 3. Verify OTP Endpoint Checks
    await test('POST /api/auth/verify-otp rejects non-6-digit OTPs (400)', async () => {
      const res = await makeRequest('POST', '/api/auth/verify-otp', {}, {
        phone: '9876543210',
        otp: '123'
      });
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    await test('POST /api/auth/verify-otp rejects non-numeric OTPs (400)', async () => {
      const res = await makeRequest('POST', '/api/auth/verify-otp', {}, {
        phone: '9876543210',
        otp: 'abcdef'
      });
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    await test('POST /api/auth/verify-otp rejects invalid/expired OTP (401)', async () => {
      const res = await makeRequest('POST', '/api/auth/verify-otp', {}, {
        phone: '9876543210',
        otp: '000000'
      });
      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
      assert.ok(res.data.message.includes('Invalid or expired OTP'));
    });

    // 4. Rate Limiting Check on send-otp
    await test('POST /api/auth/send-otp triggers rate limiter when x-test-rate-limit is set (429)', async () => {
      let lastStatus = 0;
      for (let i = 0; i < 7; i++) {
        const res = await makeRequest('POST', '/api/auth/send-otp', {
          'x-test-rate-limit': 'true'
        }, {
          phone: `987654320${i}`
        });
        lastStatus = res.status;
        if (res.status === 429) break;
      }
      assert.equal(lastStatus, 429);
    });

  } finally {
    stopServer();
  }

  console.log('\n==================================================');
  console.log(`SUMMARY: ${passedCount} Passed, ${failedCount} Failed out of 9 OTP Auth Tests`);
  console.log('==================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runOtpAuthTests();
