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

const slotMorning = {
  id: 's1111111-1111-1111-1111-111111111111',
  slot_date: '2026-09-11',
  start_time: '09:00:00',
  end_time: '11:00:00',
  max_capacity_quintals: 100.0,
  booked_capacity_quintals: 20.0,
  max_farmers: 20,
  booked_farmers: 4,
  is_active: true
};

const slotAfternoon = {
  id: 's2222222-2222-2222-2222-222222222222',
  slot_date: '2026-09-11',
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
  const result = evaluateSlotSuitability(slotMorning, baseCapacity, baseCongestion);
  assert.equal(result.isAvailable, true);
  assert.equal(result.recommendationStatus, RECOMMENDATION_STATUSES.RECOMMENDED);
  assert.equal(result.recommendationTier, RECOMMENDATION_TIERS.OPTIMAL);
  assert.ok(result.suitabilityScore >= 70);
  assert.equal(result.remainingCapacityQuintals, 80.0);
});

// --- TEST SCENARIO 2: Overloaded / High Congestion Slot ---
console.log('\n[2] Overloaded / High Congestion Slot:');
test('Penalizes slot evaluation when centre experiences CRITICAL congestion', () => {
  const criticalCongestion = {
    ...baseCongestion,
    waitingCount: 18,
    congestionScore: 85,
    congestionLevel: 'CRITICAL'
  };

  const result = evaluateSlotSuitability(slotMorning, baseCapacity, criticalCongestion);
  assert.equal(result.recommendationStatus, RECOMMENDATION_STATUSES.DISCOURAGED);
  assert.equal(result.recommendationTier, RECOMMENDATION_TIERS.HIGH_CONGESTION);
  assert.ok(result.suitabilityScore <= 35);
});

// --- TEST SCENARIO 3: Multiple Possible Slots Selection ---
console.log('\n[3] Multiple Possible Candidate Slots Ranking:');
test('Ranks morning slot over afternoon slot due to higher capacity headroom', () => {
  const slotsList = [slotAfternoon, slotMorning];
  const recommendation = recommendProcurementSlots(slotsList, baseCapacity, baseCongestion);

  assert.equal(recommendation.totalSlotsEvaluated, 2);
  assert.equal(recommendation.availableSlotsCount, 2);
  assert.ok(recommendation.bestRecommendedSlot);
  assert.equal(recommendation.bestRecommendedSlot.slotId, slotMorning.id);
  assert.ok(recommendation.candidateSlots[0].suitabilityScore > recommendation.candidateSlots[1].suitabilityScore);
});

// --- TEST SCENARIO 4: No Suitable Slot / Fully Booked ---
console.log('\n[4] No Suitable Slot / Fully Booked:');
test('Flags fully booked slot as UNAVAILABLE with zero suitability score', () => {
  const fullSlot = {
    ...slotMorning,
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

test('Returns empty bestRecommendedSlot when all evaluated slots are full', () => {
  const fullSlot = { ...slotMorning, booked_farmers: 20 };
  const recommendation = recommendProcurementSlots([fullSlot], baseCapacity, baseCongestion);

  assert.equal(recommendation.availableSlotsCount, 0);
  assert.equal(recommendation.bestRecommendedSlot, null);
  assert.ok(recommendation.recommendationSummary.includes('No available procurement slots'));
});

// --- TEST SCENARIO 5: Insufficient Data / Low Confidence ---
console.log('\n[5] Insufficient Data / Low Confidence:');
test('Sets confidenceLevel to MEDIUM when fallback processing speed is used', () => {
  const fallbackCapacity = {
    ...baseCapacity,
    isFallbackProcessingTime: true
  };

  const result = evaluateSlotSuitability(slotMorning, fallbackCapacity, baseCongestion);
  assert.equal(result.confidenceLevel, 'MEDIUM');
});

test('Sets confidenceLevel to LOW when centre status is PAUSED', () => {
  const pausedCapacity = {
    ...baseCapacity,
    status: 'PAUSED',
    activeCounters: 0
  };

  const recommendation = recommendProcurementSlots([slotMorning], pausedCapacity, baseCongestion);
  assert.equal(recommendation.dataQuality.confidenceLevel, 'LOW');
});

// --- TEST SCENARIO 6: Read-Only / Non-Mutation Invariant ---
console.log('\n[6] Read-only / Non-mutation Invariant:');
test('Smart scheduling engine does not mutate input slot objects', () => {
  const slotSnapshot = JSON.stringify(slotMorning);
  recommendProcurementSlots([slotMorning], baseCapacity, baseCongestion);

  assert.equal(JSON.stringify(slotMorning), slotSnapshot, 'Input slot object was not mutated');
});

console.log('\n==================================================');
console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}
