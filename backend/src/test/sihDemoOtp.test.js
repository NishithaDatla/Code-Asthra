import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import http from 'http';
import app from '../app.js';

dotenv.config({ path: 'c:/Users/HP/Code-Asthra/Code-Asthra/backend/.env' });

let server;
let BASE_URL;

async function startTestServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      BASE_URL = `http://localhost:${port}`;
      resolve();
    });
  });
}

async function runSihDemoOtpTests() {
  console.log('==================================================');
  console.log('SIH DEMO OTP FALLBACK TEST SUITE');
  console.log('==================================================\n');

  await startTestServer();
  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Configured Demo Phone Number with Demo OTP 250321 (Success)
    console.log('--- Test 1: Configured Demo Phone + Fixed OTP 250321 ---');
    const demoPhone = '9121901011';
    const verifyRes1 = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: demoPhone, otp: '250321' })
    });

    const verifyData1 = await verifyRes1.json();

    if (verifyRes1.status === 200 && verifyData1.success && verifyData1.data?.session?.access_token) {
      console.log('  ✅ [PASS] Demo phone + 250321 returns valid JWT session & user details.');
      passed++;
    } else {
      console.error('  ❌ [FAIL] Demo phone + 250321 verification failed:', verifyData1);
      failed++;
    }

    // Test 2: Non-Demo Phone Number with Demo OTP 250321 (Rejected)
    console.log('\n--- Test 2: Non-Demo Phone + Fixed OTP 250321 (Should Reject) ---');
    const nonDemoPhone = '9999988888';
    const verifyRes2 = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: nonDemoPhone, otp: '250321' })
    });

    const verifyData2 = await verifyRes2.json();

    if (verifyRes2.status === 401 && !verifyData2.success) {
      console.log('  ✅ [PASS] Non-demo phone rejects fixed OTP 250321 with 401 Unauthorized.');
      passed++;
    } else {
      console.error('  ❌ [FAIL] Non-demo phone unexpectedly accepted fixed OTP:', verifyData2);
      failed++;
    }

    // Test 3: Demo Phone Number with Wrong OTP (Rejected)
    console.log('\n--- Test 3: Demo Phone + Incorrect OTP (Should Reject) ---');
    const verifyRes3 = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: demoPhone, otp: '999999' })
    });

    const verifyData3 = await verifyRes3.json();

    if (verifyRes3.status === 401 && !verifyData3.success) {
      console.log('  ✅ [PASS] Demo phone rejects incorrect OTP 999999 with 401 Unauthorized.');
      passed++;
    } else {
      console.error('  ❌ [FAIL] Demo phone accepted wrong OTP:', verifyData3);
      failed++;
    }

  } catch (err) {
    console.error('Unhandled test error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n==================================================');
  console.log(`SUMMARY: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests`);
  console.log('==================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runSihDemoOtpTests();
