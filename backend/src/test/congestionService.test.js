/**
 * SmartProcure Congestion Engine Unit Test Suite (Phase 2C.3)
 */

import assert from 'node:assert/strict';
import {
  calculateCentreCongestion,
  CONGESTION_LEVELS
} from '../services/congestion.service.js';

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
console.log('SMARTPROCURE CONGESTION ENGINE UNIT TEST SUITE');
console.log('==================================================\n');

// Standard Test Fixture: 2 Active Counters, 10 min avg processing speed => 12 tokens/hr throughput
const baseCapacityMetrics = {
  centreId: 'c1111111-1111-1111-1111-111111111111',
  centreCode: 'CENTRE-TEST',
  centreName: 'Test Procurement Centre',
  status: 'OPEN',
  declaredTotalCounters: 2,
  totalCounters: 2,
  activeCounters: 2,
  counterOperatingRatio: 1.0,
  avgProcessingTimeMinutes: 10.0,
  isFallbackProcessingTime: false,
  sampleSize: 5,
  effectiveTokensPerHour: 12.0,
  baseDailyCapacityQuintals: 1000,
  effectiveDailyCapacityQuintals: 1000
};

// --- TEST SCENARIO 1: Empty / Low Load ---
console.log('[1] Empty / Low Queue Load (0 or 1 waiting farmer):');
test('Zero waiting queue yields LOW congestion level (0% score)', () => {
  const result = calculateCentreCongestion(baseCapacityMetrics, { waitingCount: 0, inServiceCount: 1 });
  assert.equal(result.congestionScore, 0);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.LOW);
  assert.equal(result.estimatedBacklogHours, 0.0);
  assert.equal(result.estimatedBacklogMinutes, 0);
  assert.equal(result.confidenceLevel, 'HIGH');
});

test('Minimal queue (1 waiting farmer, 5 mins backlog) yields LOW level (<25% score)', () => {
  // 1 farmer waiting / 12 tokens per hr = 0.083 hours (5 mins backlog)
  const result = calculateCentreCongestion(baseCapacityMetrics, { waitingCount: 1, inServiceCount: 2 });
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.LOW);
  assert.equal(result.estimatedBacklogMinutes, 5);
  assert.equal(result.congestionScore, 4); // Math.round((0.08 / 2.0) * 100) = 4%
});

// --- TEST SCENARIO 2: Normal / Medium Load ---
console.log('\n[2] Normal / Medium Queue Load (33-65% congestion score):');
test('4 waiting farmers (20 mins backlog) yields LOW level (17% score)', () => {
  // 4 waiting farmers / 12 tokens per hr = 0.33 hours (20 mins backlog) => score 17% (LOW)
  const result = calculateCentreCongestion(baseCapacityMetrics, { waitingCount: 4, inServiceCount: 2 });
  assert.equal(result.estimatedBacklogMinutes, 20);
  assert.equal(result.congestionScore, 17);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.LOW);
});

test('8 waiting farmers (40 mins backlog) yields MEDIUM level (34% score)', () => {
  // 8 waiting farmers / 12 tokens per hr = 0.67 hours (40 mins backlog) => score 34% (MEDIUM)
  const result = calculateCentreCongestion(baseCapacityMetrics, { waitingCount: 8, inServiceCount: 2 });
  assert.equal(result.estimatedBacklogMinutes, 40);
  assert.equal(result.congestionScore, 34);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.MEDIUM);
});

// --- TEST SCENARIO 3: High Load ---
console.log('\n[3] High Queue Load (>= 66% score):');
test('12 waiting farmers (60 mins backlog) yields MEDIUM level (50% score)', () => {
  // 12 waiting farmers / 12 tokens per hr = 1.00 hour (60 mins backlog) => score 50% (MEDIUM)
  const result = calculateCentreCongestion(baseCapacityMetrics, { waitingCount: 12, inServiceCount: 2 });
  assert.equal(result.estimatedBacklogHours, 1.0);
  assert.equal(result.estimatedBacklogMinutes, 60);
  assert.equal(result.congestionScore, 50);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.MEDIUM);
});

test('16 waiting farmers (80 mins backlog) yields HIGH level (67% score)', () => {
  // 16 waiting farmers / 12 tokens per hr = 1.33 hours (80 mins backlog) => score 67% (HIGH)
  const result = calculateCentreCongestion(baseCapacityMetrics, { waitingCount: 16, inServiceCount: 2 });
  assert.equal(result.estimatedBacklogMinutes, 80);
  assert.equal(result.congestionScore, 67);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.HIGH);
});

// --- TEST SCENARIO 4: High Load & Cap Bounding ---
console.log('\n[4] Severe Backlog & Score Bounding (>= 66% score):');
test('18 waiting farmers (90 mins backlog) yields HIGH level (75% score)', () => {
  // 18 waiting farmers / 12 tokens per hr = 1.50 hours (90 mins backlog) => score 75% (HIGH)
  const result = calculateCentreCongestion(baseCapacityMetrics, { waitingCount: 18, inServiceCount: 2 });
  assert.equal(result.estimatedBacklogHours, 1.5);
  assert.equal(result.estimatedBacklogMinutes, 90);
  assert.equal(result.congestionScore, 75);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.HIGH);
});

test('24+ waiting farmers (120+ mins backlog) caps score at 100% (HIGH level)', () => {
  const result = calculateCentreCongestion(baseCapacityMetrics, { waitingCount: 24, inServiceCount: 2 });
  assert.equal(result.congestionScore, 100);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.HIGH);
});

// --- TEST SCENARIO 5: Zero Active Counters / PAUSED Centre ---
console.log('\n[5] Zero Active Counters or PAUSED Centre with Waiting Farmers:');
test('Paused centre with waiting farmers yields HIGH level with score 100 and LOW confidence', () => {
  const pausedMetrics = {
    ...baseCapacityMetrics,
    status: 'PAUSED',
    activeCounters: 0,
    effectiveTokensPerHour: 0.0
  };
  const result = calculateCentreCongestion(pausedMetrics, { waitingCount: 5, inServiceCount: 0 });
  assert.equal(result.congestionScore, 100);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.HIGH);
  assert.equal(result.confidenceLevel, 'LOW');
  assert.equal(result.estimatedBacklogHours, null);
  assert.ok(result.explanation.includes('HIGH'));
});

test('Paused centre with ZERO waiting farmers yields LOW level (0% score)', () => {
  const pausedMetrics = {
    ...baseCapacityMetrics,
    status: 'PAUSED',
    activeCounters: 0,
    effectiveTokensPerHour: 0.0
  };
  const result = calculateCentreCongestion(pausedMetrics, { waitingCount: 0, inServiceCount: 0 });
  assert.equal(result.congestionScore, 0);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.LOW);
});

// --- TEST SCENARIO 6: Strict Enum & Safety Checks (No MODERATE / CRITICAL, No NaN / Infinity) ---
console.log('\n[6] Strict Enum & Safety Checks (No MODERATE/CRITICAL, Bounded, No NaN):');
test('CONGESTION_LEVELS contains ONLY LOW, MEDIUM, HIGH (No MODERATE, No CRITICAL)', () => {
  assert.deepEqual(Object.keys(CONGESTION_LEVELS).sort(), ['HIGH', 'LOW', 'MEDIUM']);
  assert.equal(CONGESTION_LEVELS.MODERATE, undefined);
  assert.equal(CONGESTION_LEVELS.CRITICAL, undefined);
});

test('Zero active counters with 0 throughput produces valid non-NaN metrics', () => {
  const zeroCap = {
    ...baseCapacityMetrics,
    activeCounters: 0,
    effectiveTokensPerHour: 0.0
  };
  const result = calculateCentreCongestion(zeroCap, { waitingCount: 0, inServiceCount: 0 });
  assert.equal(isNaN(result.congestionScore), false);
  assert.equal(isFinite(result.congestionScore), true);
  assert.equal(result.congestionScore, 0);
  assert.equal(result.congestionLevel, 'LOW');
});

// --- TEST SCENARIO 7: Read-Only Invariant ---
console.log('\n[7] Read-only Non-mutation Invariant:');
test('Congestion calculation is a pure read-only metric generator', () => {
  const initialFixture = JSON.stringify(baseCapacityMetrics);
  const result = calculateCentreCongestion(baseCapacityMetrics, { waitingCount: 10, inServiceCount: 2 });
  const postFixture = JSON.stringify(baseCapacityMetrics);

  assert.equal(initialFixture, postFixture, 'Capacity metrics fixture was not mutated');
  assert.ok(typeof result.congestionScore === 'number');
  assert.ok(typeof result.explanation === 'string');
});

console.log('\n==================================================');
console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}

