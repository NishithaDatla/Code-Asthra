/**
 * SmartProcure Bottleneck Detection Engine Unit Test Suite (Phase 2C.4)
 */

import assert from 'node:assert/strict';
import {
  detectCentreBottlenecks,
  BOTTLENECK_TYPES,
  BOTTLENECK_SEVERITIES
} from '../services/bottleneck.service.js';

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
console.log('SMARTPROCURE BOTTLENECK DETECTION TEST SUITE');
console.log('==================================================\n');

// Standard Capacity Fixture
const baseCapacity = {
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

// Standard Congestion Fixture
const baseCongestion = {
  centreId: 'c1111111-1111-1111-1111-111111111111',
  centreStatus: 'OPEN',
  waitingCount: 1,
  inServiceCount: 1,
  activeCounters: 2,
  effectiveTokensPerHour: 12.0,
  avgProcessingTimeMinutes: 10.0,
  estimatedBacklogHours: 0.08,
  estimatedBacklogMinutes: 5,
  congestionScore: 4,
  congestionLevel: 'LOW',
  confidenceLevel: 'HIGH',
  activeCounterUtilizationRatio: 0.5,
  explanation: 'LOW Congestion: 1 farmer waiting'
};

// --- TEST SCENARIO 1: No Bottlenecks (Smooth Operation) ---
console.log('[1] Smooth Operations (0 Bottlenecks):');
test('Optimal capacity and minimal queue yields zero bottlenecks', () => {
  const result = detectCentreBottlenecks(baseCapacity, baseCongestion);
  assert.equal(result.bottlenecksFound, false);
  assert.equal(result.bottleneckCount, 0);
  assert.equal(result.primaryBottleneck, null);
  assert.equal(result.overallSeverity, BOTTLENECK_SEVERITIES.NONE);
});

// --- TEST SCENARIO 2: Insufficient Active Counters ---
console.log('\n[2] Insufficient Active Counters Detection:');
test('Detects INSUFFICIENT_ACTIVE_COUNTERS when 1 of 4 counters is active (25% capacity)', () => {
  const lowCounterCapacity = {
    ...baseCapacity,
    totalCounters: 4,
    declaredTotalCounters: 4,
    activeCounters: 1,
    counterOperatingRatio: 0.25
  };
  const congestionWithWait = {
    ...baseCongestion,
    waitingCount: 6,
    activeCounters: 1
  };

  const result = detectCentreBottlenecks(lowCounterCapacity, congestionWithWait);
  assert.equal(result.bottlenecksFound, true);
  assert.equal(result.primaryBottleneck, BOTTLENECK_TYPES.INSUFFICIENT_ACTIVE_COUNTERS);
  assert.equal(result.overallSeverity, BOTTLENECK_SEVERITIES.HIGH);

  const counterBottleneck = result.detectedBottlenecks.find(b => b.type === BOTTLENECK_TYPES.INSUFFICIENT_ACTIVE_COUNTERS);
  assert.ok(counterBottleneck);
  assert.equal(counterBottleneck.evidence.inactiveCounters, 3);
});

test('Detects CRITICAL INSUFFICIENT_ACTIVE_COUNTERS when 0 active counters with waiting queue', () => {
  const zeroCounterCapacity = {
    ...baseCapacity,
    status: 'PAUSED',
    activeCounters: 0,
    counterOperatingRatio: 0.0
  };
  const congestionWithWait = {
    ...baseCongestion,
    centreStatus: 'PAUSED',
    waitingCount: 5,
    activeCounters: 0,
    congestionLevel: 'CRITICAL',
    congestionScore: 100
  };

  const result = detectCentreBottlenecks(zeroCounterCapacity, congestionWithWait);
  assert.equal(result.bottlenecksFound, true);
  assert.equal(result.overallSeverity, BOTTLENECK_SEVERITIES.CRITICAL);
});

// --- TEST SCENARIO 3: Excessive Waiting Queue ---
console.log('\n[3] Excessive Waiting Queue Detection:');
test('Detects EXCESSIVE_WAITING_QUEUE when congestion is HIGH (12 waiting farmers, 60m backlog)', () => {
  const highCongestion = {
    ...baseCongestion,
    waitingCount: 12,
    estimatedBacklogHours: 1.0,
    estimatedBacklogMinutes: 60,
    congestionScore: 50,
    congestionLevel: 'HIGH'
  };

  const result = detectCentreBottlenecks(baseCapacity, highCongestion);
  assert.equal(result.bottlenecksFound, true);

  const queueBottleneck = result.detectedBottlenecks.find(b => b.type === BOTTLENECK_TYPES.EXCESSIVE_WAITING_QUEUE);
  assert.ok(queueBottleneck);
  assert.equal(queueBottleneck.severity, BOTTLENECK_SEVERITIES.HIGH);
  assert.equal(queueBottleneck.evidence.waitingCount, 12);
});

// --- TEST SCENARIO 4: Slow Service Processing Speed ---
console.log('\n[4] Slow Service Processing Detection:');
test('Detects SLOW_SERVICE_PROCESSING when average service duration is 24m (+60% slower than 15m baseline)', () => {
  const slowCapacity = {
    ...baseCapacity,
    avgProcessingTimeMinutes: 24.0,
    isFallbackProcessingTime: false,
    sampleSize: 6
  };

  const result = detectCentreBottlenecks(slowCapacity, baseCongestion);
  assert.equal(result.bottlenecksFound, true);

  const slowBottleneck = result.detectedBottlenecks.find(b => b.type === BOTTLENECK_TYPES.SLOW_SERVICE_PROCESSING);
  assert.ok(slowBottleneck);
  assert.equal(slowBottleneck.severity, BOTTLENECK_SEVERITIES.MODERATE);
  assert.equal(slowBottleneck.evidence.slowdownPercentage, 60);
});

// --- TEST SCENARIO 5: Data Quality & Uncertainty Reporting ---
console.log('\n[5] Uncertainty & Data Quality Reporting:');
test('Reports uncertainty note when service completion sample size is insufficient (<3 entries)', () => {
  const fallbackCapacity = {
    ...baseCapacity,
    isFallbackProcessingTime: true,
    sampleSize: 1
  };

  const result = detectCentreBottlenecks(fallbackCapacity, baseCongestion);
  assert.ok(result.uncertaintyNotes.length > 0);
  assert.ok(result.uncertaintyNotes[0].includes('uncertain'));
  assert.equal(result.dataQuality.completedSampleSize, 1);
  assert.equal(result.dataQuality.isFallbackProcessingTime, true);
});

// --- TEST SCENARIO 6: Read-Only Non-mutation Invariant ---
console.log('\n[6] Read-only Non-mutation Invariant:');
test('Bottleneck detection engine does not mutate input fixtures', () => {
  const capSnapshot = JSON.stringify(baseCapacity);
  const congSnapshot = JSON.stringify(baseCongestion);

  detectCentreBottlenecks(baseCapacity, baseCongestion);

  assert.equal(JSON.stringify(baseCapacity), capSnapshot, 'Capacity fixture was not mutated');
  assert.equal(JSON.stringify(baseCongestion), congSnapshot, 'Congestion fixture was not mutated');
});

console.log('\n==================================================');
console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}
