/**
 * SmartProcure Smart Scheduling Unit Test Suite (Phase 2D.1)
 */

import assert from 'node:assert/strict';
import {
  evaluateSlotSuitability,
  recommendProcurementSlots,
  RECOMMENDATION_TIERS,
  RECOMMENDATION_STATUSES
} from '../services/scheduling.service.js';

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
console.log('SMARTPROCURE SMART SCHEDULING UNIT TEST SUITE');
console.log('==================================================\n');

// Standard Capacity & Congestion Fixtures
const baseCapacity = {
  centreId: 'c1111111-1111-1111-1111-111111111111',
  status: 'OPEN',
  totalCounters: 2,
  activeCounters: 2,
  counterOperatingRatio: 1.0,
  avgProcessingTimeMinutes: 10.0,
  isFallbackProcessingTime: false,
  effectiveTokensPerHour: 12.0
};

const baseCongestion = {
  centreId: 'c1111111-1111-1111-1111-111111111111',
  centreStatus: 'OPEN',
  waitingCount: 1,
  congestionScore: 4,
  congestionLevel: 'LOW'
};

const slotToday = {
  id: 's1111111-1111-1111-1111-111111111111',
  slot_date: new Date().toISOString().split('T')[0],
  start_time: '09:00:00',
  end_time: '11:00:00',
  max_capacity_quintals: 100.0,
  booked_capacity_quintals: 20.0,
  max_farmers: 20,
  booked_farmers: 4,
  is_active: true
};

const slotFutureLowLoad = {
  id: 's2222222-2222-2222-2222-222222222222',
  slot_date: '2099-12-31',
  start_time: '09:00:00',
  end_time: '11:00:00',
  max_capacity_quintals: 100.0,
  booked_capacity_quintals: 10.0,
  max_farmers: 20,
  booked_farmers: 2,
  is_active: true
};

const slotFutureHighLoad = {
  id: 's3333333-3333-3333-3333-333333333333',
  slot_date: '2099-12-31',
  start_time: '14:00:00',
  end_time: '16:00:00',
  max_capacity_quintals: 100.0,
  booked_capacity_quintals: 85.0,
  max_farmers: 20,
  booked_farmers: 17,
  is_active: true
};

// --- TEST SCENARIO 1: Available Slot with Low Load ---
console.log('[1] Available Slot with Low Load:');
test('Evaluates low-load slot as RECOMMENDED (OPTIMAL tier, high suitability score)', () => {
  const result = evaluateSlotSuitability(slotToday, baseCapacity, baseCongestion);
  assert.equal(result.isAvailable, true);
  assert.equal(result.recommendationStatus, RECOMMENDATION_STATUSES.RECOMMENDED);
  assert.equal(result.recommendationTier, RECOMMENDATION_TIERS.OPTIMAL);
  assert.ok(result.suitabilityScore >= 70);
  assert.equal(result.remainingCapacityQuintals, 80.0);
});

// --- TEST SCENARIO 2: Overloaded / High Congestion Today Slot ---
console.log('\n[2] Overloaded / High Congestion Today Slot:');
test('Penalizes today slot evaluation when centre experiences CRITICAL live congestion today', () => {
  const criticalCongestion = {
    ...baseCongestion,
    waitingCount: 18,
    congestionScore: 85,
    congestionLevel: 'CRITICAL'
  };

  const result = evaluateSlotSuitability(slotToday, baseCapacity, criticalCongestion);
  assert.equal(result.recommendationStatus, RECOMMENDATION_STATUSES.DISCOURAGED);
  assert.equal(result.recommendationTier, RECOMMENDATION_TIERS.HIGH_CONGESTION);
  assert.ok(result.suitabilityScore <= 35);
});

// --- TEST SCENARIO 3: Future Slot Isolation from Current Live Congestion ---
console.log('\n[3] Future Slot Isolation from Current Live Congestion:');
test('Future slot evaluation excludes current live queue congestion score', () => {
  const criticalLiveCongestion = {
    ...baseCongestion,
    waitingCount: 25,
    congestionScore: 90,
    congestionLevel: 'CRITICAL'
  };

  const result = evaluateSlotSuitability(slotFutureLowLoad, baseCapacity, criticalLiveCongestion);
  assert.equal(result.isAvailable, true);
  assert.equal(result.evidence.isFutureDate, true);
  assert.equal(result.evidence.liveCongestionExcluded, true);
  assert.equal(result.congestionSignalMode, 'FUTURE_SLOT_BOOKED_LOAD');
  assert.equal(result.recommendationStatus, RECOMMENDATION_STATUSES.RECOMMENDED);
  assert.ok(result.suitabilityScore >= 70, 'Future low-load slot maintains high score despite today live congestion');
});

// --- TEST SCENARIO 4: Future Slot with High Booked Load vs Low Booked Load ---
console.log('\n[4] Future Slots Ranking across Booked Loads & Dates:');
test('Ranks future low-load slot higher than future high-load slot', () => {
  const slotsList = [slotFutureHighLoad, slotFutureLowLoad];
  const recommendation = recommendProcurementSlots(slotsList, baseCapacity, baseCongestion);

  assert.equal(recommendation.totalSlotsEvaluated, 2);
  assert.equal(recommendation.availableSlotsCount, 2);
  assert.ok(recommendation.bestRecommendedSlot);
  assert.equal(recommendation.bestRecommendedSlot.slotId, slotFutureLowLoad.id);
  assert.ok(recommendation.candidateSlots[0].suitabilityScore > recommendation.candidateSlots[1].suitabilityScore);
});

// --- TEST SCENARIO 5: Full and Inactive Slots ---
console.log('\n[5] Full and Inactive Slots:');
test('Flags fully booked slot as UNAVAILABLE with zero suitability score', () => {
  const fullSlot = {
    ...slotFutureLowLoad,
    booked_farmers: 20,
    max_farmers: 20,
    booked_capacity_quintals: 100.0,
    max_capacity_quintals: 100.0
  };

  const result = evaluateSlotSuitability(fullSlot, baseCapacity, baseCongestion);
  assert.equal(result.isAvailable, false);
  assert.equal(result.suitabilityScore, 0);
  assert.equal(result.recommendationStatus, RECOMMENDATION_STATUSES.UNAVAILABLE);
  assert.equal(result.recommendationTier, RECOMMENDATION_TIERS.NOT_RECOMMENDED);
});

test('Flags inactive slot as UNAVAILABLE', () => {
  const inactiveSlot = {
    ...slotFutureLowLoad,
    is_active: false
  };

  const result = evaluateSlotSuitability(inactiveSlot, baseCapacity, baseCongestion);
  assert.equal(result.isAvailable, false);
  assert.equal(result.suitabilityScore, 0);
  assert.equal(result.recommendationStatus, RECOMMENDATION_STATUSES.UNAVAILABLE);
});

// --- TEST SCENARIO 6: Data Quality & Evidence Strings ---
console.log('\n[6] Data Quality, Evidence, and Read-Only Invariant:');
test('Returns detailed evidence object and clear reasons list', () => {
  const result = evaluateSlotSuitability(slotFutureLowLoad, baseCapacity, baseCongestion);
  assert.ok(result.evidence);
  assert.ok(Array.isArray(result.reasons));
  assert.ok(result.reasons.length > 0);
  assert.ok(result.reasons.some(r => r.toLowerCase().includes('booked capacity load')));
});

test('Smart scheduling engine does not mutate input slot objects', () => {
  const slotSnapshot = JSON.stringify(slotFutureLowLoad);
  recommendProcurementSlots([slotFutureLowLoad], baseCapacity, baseCongestion);

  assert.equal(JSON.stringify(slotFutureLowLoad), slotSnapshot, 'Input slot object was not mutated');
});

console.log('\n==================================================');
console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}
