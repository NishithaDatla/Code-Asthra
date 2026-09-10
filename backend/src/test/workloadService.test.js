/**
 * SmartProcure Workload Analysis Unit Test Suite (Phase 2D.2)
 */

import assert from 'node:assert/strict';
import {
  calculateCentreWorkload,
  WORKLOAD_LEVELS
} from '../services/workload.service.js';

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
console.log('SMARTPROCURE WORKLOAD ANALYSIS UNIT TEST SUITE');
console.log('==================================================\n');

// Standard Capacity Fixture
const baseCapacity = {
  centreId: 'c1111111-1111-1111-1111-111111111111',
  status: 'OPEN',
  totalCounters: 2,
  activeCounters: 2,
  effectiveTokensPerHour: 12.0,
  avgProcessingTimeMinutes: 10.0,
  isFallbackProcessingTime: false,
  sampleSize: 5
};

const baseSlots = [
  {
    id: 's1',
    max_capacity_quintals: 100.0,
    booked_capacity_quintals: 40.0,
    max_farmers: 20,
    booked_farmers: 8,
    is_active: true
  },
  {
    id: 's2',
    max_capacity_quintals: 100.0,
    booked_capacity_quintals: 30.0,
    max_farmers: 20,
    booked_farmers: 6,
    is_active: true
  }
];

const baseQueueEntries = [
  { id: 'q1', status: 'WAITING' },
  { id: 'q2', status: 'WAITING' },
  { id: 'q3', status: 'IN_SERVICE' },
  { id: 'q4', status: 'IN_SERVICE' },
  { id: 'q5', status: 'COMPLETED' }
];

// --- TEST SCENARIO 1: Normal Workload ---
console.log('[1] Normal Workload Analysis:');
test('Calculates separate scheduled, operational, and processing metrics correctly', () => {
  const result = calculateCentreWorkload(baseSlots, baseQueueEntries, baseCapacity);
  
  // Scheduled
  assert.equal(result.scheduledWorkload.totalSlots, 2);
  assert.equal(result.scheduledWorkload.totalBookedFarmers, 14);
  assert.equal(result.scheduledWorkload.totalBookedCapacityQuintals, 70.0);
  assert.equal(result.scheduledWorkload.slotCapacityUtilizationRatio, 0.35);

  // Operational
  assert.equal(result.operationalWorkload.waitingCount, 2);
  assert.equal(result.operationalWorkload.inServiceCount, 2);
  assert.equal(result.operationalWorkload.completedCount, 1);
  assert.equal(result.operationalWorkload.activeCounterLoadRatio, 1.0);

  // Processing
  assert.equal(result.processingWorkload.completedSampleSize, 5);
  assert.equal(result.processingWorkload.isFallbackProcessingTime, false);
  assert.equal(result.processingWorkload.processingMode, 'HISTORICAL_MEASURED');

  assert.equal(result.workloadLevel, WORKLOAD_LEVELS.LOW);
});

// --- TEST SCENARIO 2: High Queue Workload ---
console.log('\n[2] High Queue Workload:');
test('Flags HIGH workload level when waiting queue reaches 12 farmers', () => {
  const heavyQueue = [
    ...Array(12).fill(null).map((_, i) => ({ id: `w${i}`, status: 'WAITING' })),
    { id: 's1', status: 'IN_SERVICE' }
  ];

  const result = calculateCentreWorkload(baseSlots, heavyQueue, baseCapacity);
  assert.equal(result.workloadLevel, WORKLOAD_LEVELS.HIGH);
  assert.equal(result.operationalWorkload.waitingCount, 12);
});

// --- TEST SCENARIO 3: Slot Capacity Utilization Threshold ---
console.log('\n[3] Slot Capacity Utilization Threshold:');
test('Flags HIGH workload level when slot capacity utilization reaches 85% (>= 80% threshold)', () => {
  const fullSlots = [
    {
      id: 's1',
      max_capacity_quintals: 100.0,
      booked_capacity_quintals: 85.0,
      max_farmers: 20,
      booked_farmers: 17
    }
  ];

  const result = calculateCentreWorkload(fullSlots, baseQueueEntries, baseCapacity);
  assert.equal(result.scheduledWorkload.slotCapacityUtilizationRatio, 0.85);
  assert.equal(result.workloadLevel, WORKLOAD_LEVELS.HIGH);
});

// --- TEST SCENARIO 4: Insufficient Historical Data ---
console.log('\n[4] Insufficient Historical Data Handling:');
test('Marks processingMode as CONFIGURABLE_BASELINE_FALLBACK when historical sample size < 3', () => {
  const fallbackCapacity = {
    ...baseCapacity,
    isFallbackProcessingTime: true,
    sampleSize: 1,
    avgProcessingTimeMinutes: 15.0
  };

  const result = calculateCentreWorkload(baseSlots, baseQueueEntries, fallbackCapacity);
  assert.equal(result.processingWorkload.isFallbackProcessingTime, true);
  assert.equal(result.processingWorkload.processingMode, 'CONFIGURABLE_BASELINE_FALLBACK');
  assert.equal(result.evidence.isMeasuredProcessingTime, false);
});

// --- TEST SCENARIO 5: Zero Active Counters / Paused Centre ---
console.log('\n[5] Zero Active Counters with Waiting Queue:');
test('Flags CRITICAL workload level when centre status is PAUSED and farmers are waiting', () => {
  const pausedCapacity = {
    ...baseCapacity,
    status: 'PAUSED',
    activeCounters: 0,
    effectiveTokensPerHour: 0.0
  };

  const result = calculateCentreWorkload(baseSlots, baseQueueEntries, pausedCapacity);
  assert.equal(result.workloadLevel, WORKLOAD_LEVELS.CRITICAL);
  assert.ok(result.summary.includes('Critical'));
});

// --- TEST SCENARIO 6: Empty Data Handling ---
console.log('\n[6] Empty Data Safety:');
test('Handles empty slots array and empty queue entries array without NaN errors', () => {
  const result = calculateCentreWorkload([], [], baseCapacity);
  assert.equal(result.scheduledWorkload.totalSlots, 0);
  assert.equal(result.scheduledWorkload.farmerSlotUtilizationRatio, 0.0);
  assert.equal(result.scheduledWorkload.slotCapacityUtilizationRatio, 0.0);
  assert.equal(result.operationalWorkload.waitingCount, 0);
  assert.equal(result.workloadLevel, WORKLOAD_LEVELS.LOW);
});

// --- TEST SCENARIO 7: Read-Only Non-mutation Invariant ---
console.log('\n[7] Read-only Non-mutation Invariant:');
test('Workload calculation engine does not mutate input fixtures', () => {
  const slotsSnap = JSON.stringify(baseSlots);
  const queueSnap = JSON.stringify(baseQueueEntries);
  const capSnap = JSON.stringify(baseCapacity);

  calculateCentreWorkload(baseSlots, baseQueueEntries, baseCapacity);

  assert.equal(JSON.stringify(baseSlots), slotsSnap, 'Slots fixture was not mutated');
  assert.equal(JSON.stringify(baseQueueEntries), queueSnap, 'Queue entries fixture was not mutated');
  assert.equal(JSON.stringify(baseCapacity), capSnap, 'Capacity fixture was not mutated');
});

console.log('\n==================================================');
console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}
