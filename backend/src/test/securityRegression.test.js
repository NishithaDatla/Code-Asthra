import assert from 'node:assert';
import {
  verifyCheckInAuthorization,
  verifyStatusTransitionAuthorization,
  verifyQueueAccessAuthorization
} from '../utils/queueAuth.js';

console.log('==================================================');
console.log('SMARTPROCURE SECURITY REGRESSION TEST SUITE');
console.log('==================================================\n');

let totalPassed = 0;
let totalFailed = 0;

function runTest(description, testFn) {
  try {
    testFn();
    console.log(`  ✅ [PASS] ${description}`);
    totalPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}: ${err.message}`);
    totalFailed++;
  }
}

async function runAsyncTest(description, testFn) {
  try {
    await testFn();
    console.log(`  ✅ [PASS] ${description}`);
    totalPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}: ${err.message}`);
    totalFailed++;
  }
}

async function main() {
  console.log('[1] Testing Unauthenticated Access Handling:');
  
  await runAsyncTest('Unauthenticated user check-in attempt throws 401', async () => {
    try {
      await verifyCheckInAuthorization(null, '00000000-0000-0000-0000-000000000000');
      assert.fail('Should have thrown 401');
    } catch (err) {
      assert.strictEqual(err.statusCode, 401);
    }
  });

  await runAsyncTest('Unauthenticated status transition attempt throws 401', async () => {
    try {
      await verifyStatusTransitionAuthorization(null, '00000000-0000-0000-0000-000000000000');
      assert.fail('Should have thrown 401');
    } catch (err) {
      assert.strictEqual(err.statusCode, 401);
    }
  });

  await runAsyncTest('Unauthenticated queue details access attempt throws 401', async () => {
    try {
      await verifyQueueAccessAuthorization(null, '00000000-0000-0000-0000-000000000000');
      assert.fail('Should have thrown 401');
    } catch (err) {
      assert.strictEqual(err.statusCode, 401);
    }
  });

  console.log('\n[2] Testing Unauthorized Status Transition Attempt (Farmer Role):');

  await runAsyncTest('Farmer attempting status transition (CALLED/COMPLETED) is rejected with 403', async () => {
    const farmerUser = {
      db_id: '11111111-1111-1111-1111-111111111111',
      role: 'FARMER',
      farmer_id: '22222222-2222-2222-2222-222222222222'
    };

    try {
      await verifyStatusTransitionAuthorization(farmerUser, '33333333-3333-3333-3333-333333333333');
      assert.fail('Farmer status transition should have been rejected');
    } catch (err) {
      assert.strictEqual(err.statusCode, 403);
      assert.match(err.message, /Farmers cannot perform/);
    }
  });

  console.log('\n[3] Testing Cross-Farmer & Cross-Centre Authorization Rules:');

  await runAsyncTest('Farmer accessing another farmer\'s booking check-in throws 403 or 404', async () => {
    const farmerUser = {
      db_id: '11111111-1111-1111-1111-111111111111',
      role: 'FARMER',
      farmer_id: '22222222-2222-2222-2222-222222222222'
    };

    try {
      // Dummy booking ID
      await verifyCheckInAuthorization(farmerUser, '00000000-0000-0000-0000-000000000001');
      assert.fail('Should have thrown 404 or 403');
    } catch (err) {
      assert.ok(err.statusCode === 403 || err.statusCode === 404);
    }
  });

  await runAsyncTest('Staff attempting action at unassigned centre throws 403 or 404', async () => {
    const staffUser = {
      db_id: '44444444-4444-4444-4444-444444444444',
      role: 'CENTRE_STAFF'
    };

    try {
      await verifyStatusTransitionAuthorization(staffUser, '00000000-0000-0000-0000-000000000001');
      assert.fail('Should have thrown 403 or 404');
    } catch (err) {
      assert.ok(err.statusCode === 403 || err.statusCode === 404);
    }
  });

  console.log('\n[4] Testing System Admin Privileges:');

  await runAsyncTest('System Admin passes role check for non-existent entry with 404 instead of 403', async () => {
    const adminUser = {
      db_id: '55555555-5555-5555-5555-555555555555',
      role: 'SYSTEM_ADMIN'
    };

    try {
      await verifyStatusTransitionAuthorization(adminUser, '00000000-0000-0000-0000-000000000001');
      assert.fail('Should have thrown 404 for non-existent entry');
    } catch (err) {
      // 404 means admin passed role check and reached DB lookup
      assert.strictEqual(err.statusCode, 404);
    }
  });

  console.log('\n==================================================');
  console.log(`SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log('==================================================');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal Test Suite Failure:', err);
  process.exit(1);
});
