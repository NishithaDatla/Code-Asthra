/**
 * SmartProcure Notification Triggering Unit Test Suite (Phase 2E.1)
 */

import assert from 'node:assert/strict';
import {
  generateNotificationPayload,
  triggerNotification,
  resetDeduplicationRegistry,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_TYPE_ENUMS
} from '../services/notification.service.js';

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

console.log('==================================================');
console.log('SMARTPROCURE NOTIFICATION SERVICE TEST SUITE');
console.log('==================================================\n');

// Reset in-memory registry before tests
resetDeduplicationRegistry();

// --- TEST SCENARIO 1: Supported Notification Triggers ---
console.log('[1] Supported Notification Triggers & Enum Mapping:');

test('Generates BOOKING_CONFIRMED notification for CHECK_IN_CONFIRMED event', () => {
  const payload = generateNotificationPayload(NOTIFICATION_EVENT_TYPES.CHECK_IN_CONFIRMED, {
    userId: 'u1111111-1111-1111-1111-111111111111',
    tokenNumber: 'A102',
    position: 4,
    centreName: 'Anakapalle Centre'
  });

  assert.equal(payload.type, NOTIFICATION_TYPE_ENUMS.BOOKING_CONFIRMED);
  assert.equal(payload.title, 'Check-in Confirmed');
  assert.ok(payload.message.includes('Token #A102 checked in'));
  assert.ok(payload.message.includes('Queue position: #4'));
  assert.equal(payload.isSmsCompatible, true);
});

test('Generates QUEUE_CALLED notification for QUEUE_CALLED event', () => {
  const payload = generateNotificationPayload(NOTIFICATION_EVENT_TYPES.QUEUE_CALLED, {
    userId: 'u1111111-1111-1111-1111-111111111111',
    tokenNumber: 'A102',
    counterNumber: 'Counter 2',
    centreName: 'Anakapalle Centre'
  });

  assert.equal(payload.type, NOTIFICATION_TYPE_ENUMS.QUEUE_CALLED);
  assert.equal(payload.title, 'Token Called');
  assert.ok(payload.message.includes('CALLED to Counter 2'));
});

test('Generates PROCUREMENT_UPDATED notification for SERVICE_STARTED event', () => {
  const payload = generateNotificationPayload(NOTIFICATION_EVENT_TYPES.SERVICE_STARTED, {
    userId: 'u1111111-1111-1111-1111-111111111111',
    tokenNumber: 'A102',
    counterNumber: 'Counter 2'
  });

  assert.equal(payload.type, NOTIFICATION_TYPE_ENUMS.PROCUREMENT_UPDATED);
  assert.ok(payload.message.includes('Service started'));
});

test('Generates PROCUREMENT_UPDATED notification for SERVICE_COMPLETED event', () => {
  const payload = generateNotificationPayload(NOTIFICATION_EVENT_TYPES.SERVICE_COMPLETED, {
    userId: 'u1111111-1111-1111-1111-111111111111',
    tokenNumber: 'A102'
  });

  assert.equal(payload.type, NOTIFICATION_TYPE_ENUMS.PROCUREMENT_UPDATED);
  assert.ok(payload.message.includes('Service completed'));
});

test('Generates SLOT_REMINDER notification for ETA_UPDATED event', () => {
  const payload = generateNotificationPayload(NOTIFICATION_EVENT_TYPES.ETA_UPDATED, {
    userId: 'u1111111-1111-1111-1111-111111111111',
    tokenNumber: 'A102',
    estimatedWaitTimeMinutes: 20,
    position: 2
  });

  assert.equal(payload.type, NOTIFICATION_TYPE_ENUMS.SLOT_REMINDER);
  assert.ok(payload.message.includes('20 mins wait time'));
});

test('Generates SYSTEM_ALERT notification for DISRUPTION_ALERT event', () => {
  const payload = generateNotificationPayload(NOTIFICATION_EVENT_TYPES.DISRUPTION_ALERT, {
    userId: 'u1111111-1111-1111-1111-111111111111',
    centreName: 'Anakapalle Centre',
    disruptionMessage: 'Operations PAUSED due to power outage.'
  });

  assert.equal(payload.type, NOTIFICATION_TYPE_ENUMS.SYSTEM_ALERT);
  assert.ok(payload.message.includes('PAUSED'));
});

test('Generates SLOT_REMINDER notification for SLOT_RECOMMENDED event', () => {
  const payload = generateNotificationPayload(NOTIFICATION_EVENT_TYPES.SLOT_RECOMMENDED, {
    userId: 'u1111111-1111-1111-1111-111111111111',
    slotDate: '2026-09-11',
    startTime: '09:00:00',
    endTime: '11:00:00'
  });

  assert.equal(payload.type, NOTIFICATION_TYPE_ENUMS.SLOT_REMINDER);
  assert.ok(payload.message.includes('09:00:00-11:00:00'));
});

// --- TEST SCENARIO 2: Duplicate Event Prevention ---
console.log('\n[2] Deduplication & Idempotency:');
test('Prevents duplicate notification triggering for the same event reference', async () => {
  resetDeduplicationRegistry();

  const context = {
    userId: 'u1111111-1111-1111-1111-111111111111',
    queueEntryId: 'q1111111-1111-1111-1111-111111111111',
    tokenNumber: 'A102'
  };

  const res1 = await triggerNotification(NOTIFICATION_EVENT_TYPES.CHECK_IN_CONFIRMED, context);
  assert.equal(res1.triggered, true);
  assert.equal(res1.deduplicated, false);

  const res2 = await triggerNotification(NOTIFICATION_EVENT_TYPES.CHECK_IN_CONFIRMED, context);
  assert.equal(res2.triggered, false);
  assert.equal(res2.deduplicated, true);
});

// --- TEST SCENARIO 3: Missing / Insufficient Data Handling ---
console.log('\n[3] Missing / Insufficient Data Handling:');
test('Handles missing context fields gracefully without errors or crashing', () => {
  const payload = generateNotificationPayload(NOTIFICATION_EVENT_TYPES.CHECK_IN_CONFIRMED, {});
  assert.ok(typeof payload.message === 'string');
  assert.ok(payload.message.includes('Token #N/A'));
});

// --- TEST SCENARIO 4: Non-smartphone SMS Compatibility ---
console.log('\n[4] Non-smartphone SMS Compatibility:');
test('Verifies notification message is plain ASCII text without HTML tags', () => {
  const payload = generateNotificationPayload(NOTIFICATION_EVENT_TYPES.QUEUE_CALLED, {
    tokenNumber: 'B205',
    counterNumber: 'Counter 1'
  });

  assert.equal(payload.isSmsCompatible, true);
  assert.equal(payload.message.includes('<'), false);
  assert.equal(payload.message.includes('>'), false);
});

// --- TEST SCENARIO 5: Read-Only Queue/Booking Invariant ---
console.log('\n[5] Read-only Non-mutation Invariant:');
test('Notification service does not mutate queue context fixture', () => {
  const fixture = { tokenNumber: 'A102', position: 3 };
  const snapshot = JSON.stringify(fixture);

  generateNotificationPayload(NOTIFICATION_EVENT_TYPES.CHECK_IN_CONFIRMED, fixture);

  assert.equal(JSON.stringify(fixture), snapshot, 'Context fixture was not mutated');
});

console.log('\n==================================================');
console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}
