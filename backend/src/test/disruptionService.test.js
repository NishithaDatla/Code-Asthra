/**
 * SmartProcure Disruption Handling Unit Test Suite (Phase 2D.3)
 */

import assert from 'node:assert/strict';
import {
  detectCentreDisruptions,
  DISRUPTION_TYPES,
  DISRUPTION_SEVERITIES
} from '../services/disruption.service.js';

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
console.log('SMARTPROCURE DISRUPTION HANDLING UNIT TEST SUITE');
console.log('==================================================\n');

// Standard Fixtures
const baseCapacity = {
  centreId: 'c1111111-1111-1111-1111-111111111111',
  status: 'OPEN',
  totalCounters: 2,
  activeCounters: 2,
  avgProcessingTimeMinutes: 10.0,
  isFallbackProcessingTime: false,
  sampleSize: 5,
  effectiveTokensPerHour: 12.0
};

const baseCongestion = {
  centreId: 'c1111111-1111-1111-1111-111111111111',
  centreStatus: 'OPEN',
  waitingCount: 1,
  congestionScore: 4,
  congestionLevel: 'LOW'
};

const baseWorkload = {
  scheduledWorkload: {
    slotCapacityUtilizationRatio: 0.35,
    totalBookedFarmers: 14
  }
};

// --- TEST SCENARIO 1: No Disruptions ---
console.log('[1] Smooth Operation (0 Disruptions):');
test('Optimal capacity and low load yields zero operational disruptions', () => {
  const result = detectCentreDisruptions(baseCapacity, baseCongestion, {}, baseWorkload);
  assert.equal(result.disruptionsFound, false);
  assert.equal(result.disruptionCount, 0);
  assert.equal(result.overallDisruptionSeverity, DISRUPTION_SEVERITIES.NONE);
});

// --- TEST SCENARIO 2: Centre Paused / Closed ---
console.log('\n[2] Centre Status Halted Disruption:');
test('Detects CENTRE_STATUS_HALTED when status is PAUSED', () => {
  const pausedCapacity = {
    ...baseCapacity,
    status: 'PAUSED',
    activeCounters: 0
  };
  const result = detectCentreDisruptions(pausedCapacity, baseCongestion, {}, baseWorkload);

  assert.equal(result.disruptionsFound, true);
  const disruption = result.disruptions.find(d => d.type === DISRUPTION_TYPES.CENTRE_STATUS_HALTED);
  assert.ok(disruption);
  assert.equal(disruption.observedEvidence.centreStatus, 'PAUSED');
  assert.ok(disruption.recommendedAction.length > 0);
  assert.ok(disruption.possibleCauses.length > 0);
});

// --- TEST SCENARIO 3: Zero Active Counters with Waiting Queue ---
console.log('\n[3] Zero Active Counters Disruption:');
test('Detects ZERO_ACTIVE_COUNTERS when 0 counters active with waiting farmers', () => {
  const zeroCountersCap = {
    ...baseCapacity,
    activeCounters: 0
  };
  const waitingCongestion = {
    ...baseCongestion,
    waitingCount: 5
  };

  const result = detectCentreDisruptions(zeroCountersCap, waitingCongestion, {}, baseWorkload);
  assert.equal(result.disruptionsFound, true);

  const disruption = result.disruptions.find(d => d.type === DISRUPTION_TYPES.ZERO_ACTIVE_COUNTERS);
  assert.ok(disruption);
  assert.equal(disruption.severity, DISRUPTION_SEVERITIES.CRITICAL);
  assert.equal(disruption.observedEvidence.waitingCount, 5);
});

// --- TEST SCENARIO 4: Severe Queue Congestion ---
console.log('\n[4] Severe Queue Congestion Disruption:');
test('Detects SEVERE_QUEUE_CONGESTION when congestion score >= 75 (CRITICAL level)', () => {
  const criticalCongestion = {
    ...baseCongestion,
    waitingCount: 18,
    estimatedBacklogHours: 1.5,
    estimatedBacklogMinutes: 90,
    congestionScore: 75,
    congestionLevel: 'CRITICAL'
  };

  const result = detectCentreDisruptions(baseCapacity, criticalCongestion, {}, baseWorkload);
  assert.equal(result.disruptionsFound, true);

  const disruption = result.disruptions.find(d => d.type === DISRUPTION_TYPES.SEVERE_QUEUE_CONGESTION);
  assert.ok(disruption);
  assert.equal(disruption.severity, DISRUPTION_SEVERITIES.CRITICAL);
  assert.equal(disruption.observedEvidence.congestionScore, 75);
});

// --- TEST SCENARIO 5: Unusually Slow Processing Duration ---
console.log('\n[5] Unusually Slow Processing Duration Disruption:');
test('Detects UNUSUALLY_SLOW_PROCESSING when average service duration is 24m (+60% slower than baseline)', () => {
  const slowCapacity = {
    ...baseCapacity,
    avgProcessingTimeMinutes: 24.0,
    isFallbackProcessingTime: false,
    sampleSize: 5
  };

  const result = detectCentreDisruptions(slowCapacity, baseCongestion, {}, baseWorkload);
  assert.equal(result.disruptionsFound, true);

  const disruption = result.disruptions.find(d => d.type === DISRUPTION_TYPES.UNUSUALLY_SLOW_PROCESSING);
  assert.ok(disruption);
  assert.equal(disruption.observedEvidence.measuredAvgProcessingTimeMinutes, 24.0);
});

// --- TEST SCENARIO 6: Multiple Disruptions Simultaneous Detection ---
console.log('\n[6] Multiple Simultaneous Disruptions Detection:');
test('Detects both ZERO_ACTIVE_COUNTERS and SEVERE_QUEUE_CONGESTION simultaneously', () => {
  const multiCap = { ...baseCapacity, activeCounters: 0 };
  const multiCong = { ...baseCongestion, waitingCount: 20, congestionScore: 85, congestionLevel: 'CRITICAL' };

  const result = detectCentreDisruptions(multiCap, multiCong, {}, baseWorkload);
  assert.equal(result.disruptionsFound, true);
  assert.ok(result.disruptionCount >= 2);
  assert.equal(result.overallDisruptionSeverity, DISRUPTION_SEVERITIES.CRITICAL);
});

// --- TEST SCENARIO 7: Insufficient Data Handling ---
console.log('\n[7] Insufficient Data Handling:');
test('Adds uncertaintyNote when sample size is insufficient (<3 entries) instead of false slow service flag', () => {
  const fallbackCap = {
    ...baseCapacity,
    isFallbackProcessingTime: true,
    sampleSize: 1
  };

  const result = detectCentreDisruptions(fallbackCap, baseCongestion, {}, baseWorkload);
  assert.ok(result.uncertaintyNotes.length > 0);
  assert.ok(result.uncertaintyNotes[0].includes('uncertain'));
});

// --- TEST SCENARIO 8: Read-Only Non-mutation Invariant ---
console.log('\n[8] Read-only Non-mutation Invariant:');
test('Disruption handling engine does not mutate input fixtures', () => {
  const capSnap = JSON.stringify(baseCapacity);
  const congSnap = JSON.stringify(baseCongestion);

  detectCentreDisruptions(baseCapacity, baseCongestion, {}, baseWorkload);

  assert.equal(JSON.stringify(baseCapacity), capSnap, 'Capacity fixture was not mutated');
  assert.equal(JSON.stringify(baseCongestion), congSnap, 'Congestion fixture was not mutated');
});

console.log('\n==================================================');
console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}
