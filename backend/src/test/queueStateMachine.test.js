import {
  isValidTransition,
  validateTransition,
  getDerivedEventType,
  QUEUE_STATUS,
  QUEUE_EVENT_TYPE
} from '../utils/queueStateMachine.js';

console.log('==================================================');
console.log('SMARTPROCURE QUEUE STATE MACHINE UNIT TEST SUITE');
console.log('==================================================\n');

const VALID_TEST_CASES = [
  { from: QUEUE_STATUS.WAITING, to: QUEUE_STATUS.CALLED, expectedEvent: QUEUE_EVENT_TYPE.CALLED },
  { from: QUEUE_STATUS.WAITING, to: QUEUE_STATUS.SKIPPED, expectedEvent: QUEUE_EVENT_TYPE.SKIPPED },
  { from: QUEUE_STATUS.CALLED, to: QUEUE_STATUS.IN_SERVICE, expectedEvent: QUEUE_EVENT_TYPE.SERVICE_STARTED },
  { from: QUEUE_STATUS.CALLED, to: QUEUE_STATUS.SKIPPED, expectedEvent: QUEUE_EVENT_TYPE.SKIPPED },
  { from: QUEUE_STATUS.IN_SERVICE, to: QUEUE_STATUS.COMPLETED, expectedEvent: QUEUE_EVENT_TYPE.SERVICE_COMPLETED }
];

const INVALID_TEST_CASES = [
  { from: QUEUE_STATUS.WAITING, to: QUEUE_STATUS.IN_SERVICE },
  { from: QUEUE_STATUS.WAITING, to: QUEUE_STATUS.COMPLETED },
  { from: QUEUE_STATUS.CALLED, to: QUEUE_STATUS.COMPLETED },
  { from: QUEUE_STATUS.COMPLETED, to: QUEUE_STATUS.WAITING },
  { from: QUEUE_STATUS.COMPLETED, to: QUEUE_STATUS.CALLED },
  { from: QUEUE_STATUS.COMPLETED, to: QUEUE_STATUS.IN_SERVICE },
  { from: QUEUE_STATUS.SKIPPED, to: QUEUE_STATUS.WAITING },
  { from: QUEUE_STATUS.SKIPPED, to: QUEUE_STATUS.CALLED },
  { from: QUEUE_STATUS.SKIPPED, to: QUEUE_STATUS.IN_SERVICE },
  { from: QUEUE_STATUS.SKIPPED, to: QUEUE_STATUS.COMPLETED }
];

let totalPassed = 0;
let totalFailed = 0;

console.log('[1] Testing Valid Transitions & Event Derivations:');
VALID_TEST_CASES.forEach(({ from, to, expectedEvent }) => {
  const isValid = isValidTransition(from, to);
  const derivedEvent = getDerivedEventType(from, to);
  let validatedEvent = null;

  try {
    validatedEvent = validateTransition(from, to);
  } catch (err) {
    console.error(`  ❌ Failed unexpected error: ${from} -> ${to}`);
  }

  if (isValid && derivedEvent === expectedEvent && validatedEvent === expectedEvent) {
    console.log(`  ✅ [PASS] ${from} -> ${to} | Derived Event: ${derivedEvent}`);
    totalPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${from} -> ${to} | Expected: ${expectedEvent}, Got: ${derivedEvent}`);
    totalFailed++;
  }
});

console.log('\n[2] Testing Invalid Transitions Rejection:');
INVALID_TEST_CASES.forEach(({ from, to }) => {
  const isValid = isValidTransition(from, to);
  let threwException = false;

  try {
    validateTransition(from, to);
  } catch (err) {
    if (err.name === 'InvalidTransitionError' && err.statusCode === 400) {
      threwException = true;
    }
  }

  if (!isValid && threwException) {
    console.log(`  ✅ [PASS] Correctly rejected illegal transition: ${from} -> ${to}`);
    totalPassed++;
  } else {
    console.error(`  ❌ [FAIL] Allowed illegal transition: ${from} -> ${to}`);
    totalFailed++;
  }
});

console.log('\n==================================================');
console.log(`SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`);
console.log('==================================================');

if (totalFailed > 0) {
  process.exit(1);
}
