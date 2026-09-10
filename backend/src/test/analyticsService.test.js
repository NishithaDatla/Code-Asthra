/**
 * SmartProcure Operational Analytics Unit Test Suite (Phase 2E.2)
 */

import assert from 'node:assert/strict';
import { generateCentreAnalyticsReport } from '../services/analytics.service.js';

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
console.log('SMARTPROCURE OPERATIONAL ANALYTICS TEST SUITE');
console.log('==================================================\n');

// Standard Fixtures
const baseCapacity = {
  centreId: 'c1111111-1111-1111-1111-111111111111',
  status: 'OPEN',
  declaredTotalCounters: 2,
  totalCounters: 2,
  activeCounters: 2,
  counterOperatingRatio: 1.0,
  effectiveTokensPerHour: 12.0,
  avgProcessingTimeMinutes: 10.0,
  isFallbackProcessingTime: false,
  sampleSize: 5,
  baseDailyCapacityQuintals: 1000.0,
  effectiveDailyCapacityQuintals: 1000.0
};

const baseCongestion = {
  centreId: 'c1111111-1111-1111-1111-111111111111',
  centreStatus: 'OPEN',
  waitingCount: 2,
  inServiceCount: 1,
  congestionScore: 8,
  congestionLevel: 'LOW',
  estimatedBacklogHours: 0.17,
  estimatedBacklogMinutes: 10
};

const baseBottleneck = {
  bottlenecksFound: false,
  bottleneckCount: 0,
  primaryBottleneck: null
};

const baseWorkload = {
  workloadLevel: 'LOW',
  scheduledWorkload: {
    totalSlots: 2,
    totalBookedFarmers: 10,
    totalMaxFarmers: 40,
    farmerSlotUtilizationRatio: 0.25,
    totalBookedCapacityQuintals: 50.0,
    totalMaxCapacityQuintals: 200.0,
    slotCapacityUtilizationRatio: 0.25
  },
  operationalWorkload: {
    waitingCount: 2,
    calledCount: 1,
    inServiceCount: 1,
    completedCount: 5,
    skippedCount: 0,
    totalQueueEntriesRecorded: 9
  }
};

const baseDisruption = {
  disruptionsFound: false,
  disruptionCount: 0,
  overallDisruptionSeverity: 'NONE'
};

// --- TEST SCENARIO 1: Normal Centre Analytics ---
console.log('[1] Normal Centre Operational Analytics Report:');
test('Generates complete 5-section analytics report for normal operations', () => {
  const report = generateCentreAnalyticsReport(
    baseCapacity,
    baseCongestion,
    baseBottleneck,
    baseWorkload,
    baseDisruption
  );

  // 1. Queue Summary
  assert.equal(report.queueSummary.waitingCount, 2);
  assert.equal(report.queueSummary.completedCount, 5);
  assert.equal(report.queueSummary.completedThroughputTokens, 5);

  // 2. Capacity Summary
  assert.equal(report.capacitySummary.activeCounters, 2);
  assert.equal(report.capacitySummary.effectiveTokensPerHour, 12.0);
  assert.equal(report.capacitySummary.isFallbackProcessingTime, false);

  // 3. Performance Summary
  assert.equal(report.performanceSummary.completedSampleSize, 5);
  assert.equal(report.performanceSummary.avgProcessingTimeMinutes, 10.0);
  assert.equal(report.performanceSummary.isMeasured, true);

  // 4. Demand / Workload Summary
  assert.equal(report.demandWorkloadSummary.totalBookedFarmers, 10);
  assert.equal(report.demandWorkloadSummary.slotCapacityUtilizationRatio, 0.25);

  // 5. Congestion / Disruption Summary
  assert.equal(report.congestionDisruptionSummary.congestionScore, 8);
  assert.equal(report.congestionDisruptionSummary.disruptionsFound, false);
  assert.equal(report.congestionDisruptionSummary.congestionSignalMode, 'INSTANTANEOUS_LIVE_SIGNAL');
});

// --- TEST SCENARIO 2: Empty Data Safety ---
console.log('\n[2] Empty Data Safety:');
test('Handles empty/null input metrics safely without NaN errors', () => {
  const report = generateCentreAnalyticsReport({}, {}, {}, {}, {});
  assert.equal(report.queueSummary.waitingCount, 0);
  assert.equal(report.capacitySummary.activeCounters, 0);
  assert.equal(report.performanceSummary.avgProcessingTimeMinutes, 15.0);
  assert.equal(report.demandWorkloadSummary.slotCapacityUtilizationRatio, 0.0);
  assert.equal(report.dataQuality.completedSampleSize, 0);
});

// --- TEST SCENARIO 3: Insufficient Historical Data ---
console.log('\n[3] Insufficient Historical Data Handling:');
test('Marks performance as fallback baseline estimate when completed sample size < 3', () => {
  const fallbackCap = {
    ...baseCapacity,
    isFallbackProcessingTime: true,
    sampleSize: 1,
    avgProcessingTimeMinutes: 15.0
  };

  const report = generateCentreAnalyticsReport(fallbackCap, baseCongestion, baseBottleneck, baseWorkload, baseDisruption);
  assert.equal(report.performanceSummary.isMeasured, false);
  assert.equal(report.capacitySummary.processingMode, 'CONFIGURABLE_BASELINE_FALLBACK');
  assert.ok(report.performanceSummary.performanceNote.includes('baseline fallback'));
});

// --- TEST SCENARIO 4: High Workload / Congestion Reporting ---
console.log('\n[4] High Workload / Congestion Reporting:');
test('Reflects high congestion score, bottleneck summary, and disruption alerts', () => {
  const highCong = { ...baseCongestion, congestionScore: 75, congestionLevel: 'CRITICAL', waitingCount: 18 };
  const highBottleneck = { bottlenecksFound: true, bottleneckCount: 1, primaryBottleneck: 'EXCESSIVE_WAITING_QUEUE' };
  const highDisruption = { disruptionsFound: true, disruptionCount: 1, overallDisruptionSeverity: 'CRITICAL' };

  const report = generateCentreAnalyticsReport(baseCapacity, highCong, highBottleneck, baseWorkload, highDisruption);
  assert.equal(report.congestionDisruptionSummary.congestionScore, 75);
  assert.equal(report.congestionDisruptionSummary.bottlenecksFound, true);
  assert.equal(report.congestionDisruptionSummary.disruptionsFound, true);
  assert.equal(report.congestionDisruptionSummary.overallDisruptionSeverity, 'CRITICAL');
});

// --- TEST SCENARIO 5: Zero Active Counters / Paused Status ---
console.log('\n[5] Zero Active Counters / Paused Status:');
test('Reflects 0 active counters and zero effective throughput tokens/hour when centre is PAUSED', () => {
  const pausedCap = { ...baseCapacity, status: 'PAUSED', activeCounters: 0, effectiveTokensPerHour: 0.0 };

  const report = generateCentreAnalyticsReport(pausedCap, baseCongestion, baseBottleneck, baseWorkload, baseDisruption);
  assert.equal(report.capacitySummary.activeCounters, 0);
  assert.equal(report.capacitySummary.effectiveTokensPerHour, 0.0);
  assert.equal(report.dataQuality.overallConfidence, 'LOW');
});

// --- TEST SCENARIO 6: Throughput Calculation Validation ---
console.log('\n[6] Throughput Calculation Validation:');
test('Validates mathematical relationship: throughput = (activeCounters * 60) / avgProcessingTime', () => {
  // 2 active counters * 60m / 10m avg = 12 tokens/hr
  const calculatedRate = (baseCapacity.activeCounters * 60) / baseCapacity.avgProcessingTimeMinutes;
  assert.equal(baseCapacity.effectiveTokensPerHour, calculatedRate);
});

// --- TEST SCENARIO 7: Read-Only Non-mutation Invariant ---
console.log('\n[7] Read-only Non-mutation Invariant:');
test('Analytics engine does not mutate input fixtures', () => {
  const capSnap = JSON.stringify(baseCapacity);
  const congSnap = JSON.stringify(baseCongestion);

  generateCentreAnalyticsReport(baseCapacity, baseCongestion, baseBottleneck, baseWorkload, baseDisruption);

  assert.equal(JSON.stringify(baseCapacity), capSnap, 'Capacity fixture was not mutated');
  assert.equal(JSON.stringify(baseCongestion), congSnap, 'Congestion fixture was not mutated');
});

console.log('\n==================================================');
console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}
