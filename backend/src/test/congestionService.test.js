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

// --- TEST SCENARIO 2: Normal / Moderate Load ---
console.log('\n[2] Normal / Moderate Queue Load (30-60 mins backlog):');
test('4 waiting farmers (20 mins backlog) yields LOW-MODERATE range', () => {
  // 4 waiting farmers / 12 tokens per hr = 0.33 hours (20 mins backlog) => score 17% (LOW)
  const result = calculateCentreCongestion(baseCapacityMetrics, { waitingCount: 4, inServiceCount: 2 });
  assert.equal(result.estimatedBacklogMinutes, 20);
  assert.equal(result.congestionScore, 17);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.LOW);
});

test('6 waiting farmers (30 mins backlog) yields MODERATE level (25% score)', () => {
  // 6 waiting farmers / 12 tokens per hr = 0.50 hours (30 mins backlog) => score 25% (MODERATE)
  const result = calculateCentreCongestion(baseCapacityMetrics, { waitingCount: 6, inServiceCount: 2 });
  assert.equal(result.estimatedBacklogMinutes, 30);
  assert.equal(result.congestionScore, 25);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.MODERATE);
});

// --- TEST SCENARIO 3: High Load ---
console.log('\n[3] High Queue Load (60-90 mins backlog):');
test('12 waiting farmers (60 mins backlog) yields HIGH level (50% score)', () => {
  // 12 waiting farmers / 12 tokens per hr = 1.00 hour (60 mins backlog) => score 50% (HIGH)
  const result = calculateCentreCongestion(baseCapacityMetrics, { waitingCount: 12, inServiceCount: 2 });
  assert.equal(result.estimatedBacklogHours, 1.0);
  assert.equal(result.estimatedBacklogMinutes, 60);
  assert.equal(result.congestionScore, 50);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.HIGH);
});

test('15 waiting farmers (75 mins backlog) yields HIGH level (63% score)', () => {
  // 15 waiting farmers / 12 tokens per hr = 1.25 hours (75 mins backlog) => score 63% (HIGH)
  const result = calculateCentreCongestion(baseCapacityMetrics, { waitingCount: 15, inServiceCount: 2 });
  assert.equal(result.estimatedBacklogMinutes, 75);
  assert.equal(result.congestionScore, 63);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.HIGH);
});

// --- TEST SCENARIO 4: Critical Load / Severe Backlog ---
console.log('\n[4] Critical Queue Load (>= 90 mins backlog):');
test('18 waiting farmers (90 mins backlog) yields CRITICAL level (75% score)', () => {
  // 18 waiting farmers / 12 tokens per hr = 1.50 hours (90 mins backlog) => score 75% (CRITICAL)
  const result = calculateCentreCongestion(baseCapacityMetrics, { waitingCount: 18, inServiceCount: 2 });
  assert.equal(result.estimatedBacklogHours, 1.5);
  assert.equal(result.estimatedBacklogMinutes, 90);
  assert.equal(result.congestionScore, 75);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.CRITICAL);
});

test('24+ waiting farmers (120+ mins backlog) caps score at 100% (CRITICAL level)', () => {
  const result = calculateCentreCongestion(baseCapacityMetrics, { waitingCount: 24, inServiceCount: 2 });
  assert.equal(result.congestionScore, 100);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.CRITICAL);
});

// --- TEST SCENARIO 5: Zero Active Counters / PAUSED Centre ---
console.log('\n[5] Zero Active Counters or PAUSED Centre with Waiting Farmers:');
test('Paused centre with waiting farmers yields CRITICAL level with score 100 and LOW confidence', () => {
  const pausedMetrics = {
    ...baseCapacityMetrics,
    status: 'PAUSED',
    activeCounters: 0,
    effectiveTokensPerHour: 0.0
  };
  const result = calculateCentreCongestion(pausedMetrics, { waitingCount: 5, inServiceCount: 0 });
  assert.equal(result.congestionScore, 100);
  assert.equal(result.congestionLevel, CONGESTION_LEVELS.CRITICAL);
  assert.equal(result.confidenceLevel, 'LOW');
  assert.equal(result.estimatedBacklogHours, null);
  assert.ok(result.explanation.includes('CRITICAL'));
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

// --- TEST SCENARIO 6: Insufficient Data / Fallback Confidence ---
console.log('\n[6] Insufficient Data / Fallback Processing Speed:');
test('Uses MEDIUM confidence level when baseline fallback processing speed is active', () => {
  const fallbackCapacity = {
    ...baseCapacityMetrics,
    isFallbackProcessingTime: true,
    sampleSize: 1
  };
  const result = calculateCentreCongestion(fallbackCapacity, { waitingCount: 6, inServiceCount: 2 });
  assert.equal(result.confidenceLevel, 'MEDIUM');
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
